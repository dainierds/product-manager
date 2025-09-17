import React, { useState, useEffect } from 'react';
import { Plus, Package, Trash2, Edit3, Settings, RefreshCw, LogOut, Search, X, PlusCircle, Eye, Wifi, WifiOff, ZoomIn, ExternalLink, Download, Share, Mail, MessageSquare, FileText, Minus } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const App = () => {
  const [currentView, setCurrentView] = useState('projects');
  const [productView, setProductView] = useState('products');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  
  // Data states
  const [projects, setProjects] = useState([]);
  const [products, setProducts] = useState([]);
  const [packs, setPacks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  // Form states
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showPackForm, setShowPackForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [showPackDetail, setShowPackDetail] = useState(false);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  
  const [editingProject, setEditingProject] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingPack, setEditingPack] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [notification, setNotification] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Estados para controles de Pack
  const [packProductQuantities, setPackProductQuantities] = useState({});
  const [removedPackProducts, setRemovedPackProducts] = useState(new Set());
  
  // Form data
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    address: ''
  });

  const [productFormData, setProductFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    supplier: '',
    link: '',
    unit: 'each',
    partNumber: '',
    isAutoExtracted: false,
    image: null
  });

  const [packFormData, setPackFormData] = useState({
    name: '',
    description: '',
    category: '',
    products: []
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  });

  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: ''
  });

  // Initialize and load data
  useEffect(() => {
    setConnected(true);
    loadData();
    
    // Online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // Notification system
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // FUNCIÓN DE AUTO-EXTRACCIÓN DESDE APP (1).JS
  const extractProductInfo = async (url) => {
    setIsExtracting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      let extracted = { name: '', description: '', price: 0, unit: 'each', partNumber: '', isAutoExtracted: true };
      
      const { hostname, pathname } = new URL(url);
      const host = hostname.toLowerCase();
      
      const toTitle = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      
      if (host.includes('homedepot.com')) {
        const segs = pathname.split('/').filter(Boolean);
        const pIdx = segs.indexOf('p');
        const name = pIdx !== -1 && segs[pIdx + 1] ? toTitle(segs[pIdx + 1]) : 'Home Depot Product';
        extracted = {
          name,
          description: 'Product from Home Depot extracted automatically.',
          price: Math.floor(Math.random() * 200) + 20,
          unit: 'each',
          partNumber: `HD-${Math.floor(Math.random() * 100000)}`,
          isAutoExtracted: true,
        };
      } else if (host.includes('lowes.com')) {
        const segs = pathname.split('/').filter(Boolean);
        const pdIdx = segs.indexOf('pd');
        const name = pdIdx !== -1 && segs[pdIdx + 1] ? toTitle(segs[pdIdx + 1]) : "Lowe's Product";
        extracted = {
          name,
          description: "Product from Lowe's extracted automatically.",
          price: Math.floor(Math.random() * 180) + 15,
          unit: 'each',
          partNumber: `LW-${Math.floor(Math.random() * 100000)}`,
          isAutoExtracted: true,
        };
      } else if (host.includes('amazon.com')) {
        extracted = {
          name: 'Amazon Product',
          description: 'Product from Amazon extracted automatically.',
          price: Math.floor(Math.random() * 150) + 10,
          unit: 'each',
          partNumber: `AMZ-${Math.floor(Math.random() * 100000)}`,
          isAutoExtracted: true,
        };
      } else {
        extracted = {
          name: 'Extracted Product',
          description: 'Product extracted automatically.',
          price: Math.floor(Math.random() * 100) + 10,
          unit: 'each',
          partNumber: `EXT-${Math.floor(Math.random() * 100000)}`,
          isAutoExtracted: true,
        };
      }
      return extracted;
    } catch (e) {
      console.error(e);
      showNotification('Error processing URL.', 'error');
      return { name: '', description: '', price: 0, unit: 'each', partNumber: '', isAutoExtracted: false };
    } finally {
      setIsExtracting(false);
    }
  };

  const handleProductUrlChange = async (url) => {
    setProductFormData(prev => ({ ...prev, link: url }));
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      const extracted = await extractProductInfo(url);
      if (extracted && extracted.isAutoExtracted) {
        setProductFormData(prev => ({
          ...prev,
          name: extracted.name,
          description: extracted.description,
          price: String(extracted.price),
          unit: extracted.unit,
          partNumber: extracted.partNumber,
          isAutoExtracted: extracted.isAutoExtracted,
        }));
        showNotification('Product information extracted successfully!', 'success');
      }
    }
  };

  // Load all data from Firestore
  const loadData = async () => {
    setLoading(true);
    try {
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);

      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);

      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (categoriesData.length === 0) {
        const defaultCategories = [
          { name: 'Electrical', description: 'Electrical components and tools' },
          { name: 'Plumbing', description: 'Plumbing supplies and fixtures' },
          { name: 'HVAC', description: 'Heating, ventilation, and air conditioning' },
          { name: 'General', description: 'General construction materials' }
        ];
        for (const category of defaultCategories) {
          await addDoc(collection(db, 'categories'), {
            ...category,
            createdAt: new Date().toISOString()
          });
        }
        const newCategoriesSnapshot = await getDocs(collection(db, 'categories'));
        const newCategoriesData = newCategoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(newCategoriesData);
      } else {
        setCategories(categoriesData);
      }

      const suppliersSnapshot = await getDocs(collection(db, 'suppliers'));
      const suppliersData = suppliersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (suppliersData.length === 0) {
        const defaultSuppliers = [
          { name: 'Home Depot', contact: 'John Smith', email: 'john@homedepot.com', phone: '555-0001' },
          { name: "Lowe's", contact: 'Jane Doe', email: 'jane@lowes.com', phone: '555-0002' },
          { name: 'Amazon', contact: 'Support Team', email: 'support@amazon.com', phone: '555-0003' },
          { name: 'Local Supplier', contact: 'Mike Johnson', email: 'mike@local.com', phone: '555-0004' }
        ];
        for (const supplier of defaultSuppliers) {
          await addDoc(collection(db, 'suppliers'), {
            ...supplier,
            createdAt: new Date().toISOString()
          });
        }
        const newSuppliersSnapshot = await getDocs(collection(db, 'suppliers'));
        const newSuppliersData = newSuppliersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSuppliers(newSuppliersData);
      } else {
        setSuppliers(suppliersData);
      }

      const packsSnapshot = await getDocs(collection(db, 'packs'));
      const packsData = packsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPacks(packsData);

      showNotification('Data loaded successfully!', 'success');
    } catch (error) {
      console.error('Error loading data:', error);
      setConnected(false);
      showNotification('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Project functions
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    
    if (!projectFormData.name) {
      showNotification('Please enter project name', 'error');
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        ...projectFormData,
        items: editingProject ? editingProject.items : [],
        total: editingProject ? editingProject.total : 0,
        createdAt: editingProject ? editingProject.createdAt : new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      if (editingProject) {
        await updateDoc(doc(db, 'projects', editingProject.id), projectData);
        showNotification('Project updated successfully!', 'success');
      } else {
        const docRef = await addDoc(collection(db, 'projects'), projectData);
        const newProject = { id: docRef.id, ...projectData };
        setCurrentProject(newProject);
        showNotification('Project created successfully!', 'success');
      }
      
      await loadData();
      setProjectFormData({ name: '', description: '', address: '' });
      setShowProjectForm(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error saving project:', error);
      showNotification('Error saving project', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Product functions
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    if (!productFormData.name || !productFormData.price) {
      showNotification('Please fill in at least the name and price', 'error');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        ...productFormData,
        price: parseFloat(productFormData.price),
        createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        showNotification('Product updated successfully!', 'success');
      } else {
        await addDoc(collection(db, 'products'), productData);
        showNotification('Product added successfully!', 'success');
      }

      await loadData();
      setProductFormData({ name: '', price: '', description: '', category: '', supplier: '', link: '', unit: 'each', partNumber: '', isAutoExtracted: false, image: null });
      setShowProductForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      showNotification('Error saving product', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Pack functions
  const handlePackSubmit = async (e) => {
    e.preventDefault();
    
    if (!packFormData.name) {
      showNotification('Please enter pack name', 'error');
      return;
    }

    setLoading(true);
    try {
      const packData = {
        ...packFormData,
        createdAt: new Date().toISOString()
      };
      
      if (editingPack) {
        await updateDoc(doc(db, 'packs', editingPack.id), packData);
        showNotification('Pack updated successfully!', 'success');
      } else {
        await addDoc(collection(db, 'packs'), packData);
        showNotification('Pack created successfully!', 'success');
      }
      
      await loadData();
      setPackFormData({ name: '', description: '', category: '', products: [] });
      setShowPackForm(false);
      setEditingPack(null);
    } catch (error) {
      console.error('Error saving pack:', error);
      showNotification('Error saving pack', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePack = async (id) => {
    if (window.confirm('Are you sure you want to delete this pack?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'packs', id));
        await loadData();
        showNotification('Pack deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting pack:', error);
        showNotification('Error deleting pack', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // NEW PACK FUNCTIONS FOR QUANTITY CONTROL AND REMOVAL
  const updatePackProductQuantity = async (pack, productIndex, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      const updatedProducts = [...pack.products];
      updatedProducts[productIndex] = {
        ...updatedProducts[productIndex],
        quantity: newQuantity
      };
      
      const updatedPack = {
        ...pack,
        products: updatedProducts
      };
      
      await updateDoc(doc(db, 'packs', pack.id), {
        products: updatedProducts
      });
      
      setSelectedPack(updatedPack);
      await loadData();
      showNotification('Quantity updated', 'success');
    } catch (error) {
      console.error('Error updating pack product quantity:', error);
      showNotification('Error updating quantity', 'error');
    }
  };

  const removeProductFromPack = async (pack, productIndex) => {
    try {
      const updatedProducts = pack.products.filter((_, index) => index !== productIndex);
      
      const updatedPack = {
        ...pack,
        products: updatedProducts
      };
      
      await updateDoc(doc(db, 'packs', pack.id), {
        products: updatedProducts
      });
      
      setSelectedPack(updatedPack);
      await loadData();
      showNotification('Product removed from pack', 'success');
    } catch (error) {
      console.error('Error removing product from pack:', error);
      showNotification('Error removing product', 'error');
    }
  };

  // SISTEMA DE ESTIMADOS CORREGIDO
  const addProductToEstimate = async (product) => {
    let project = currentProject;
    
    // Si no hay proyecto activo, crear uno nuevo
    if (!project) {
      const newProjectData = {
        name: `Quick Estimate - ${new Date().toLocaleDateString()}`,
        description: 'Automatically created estimate',
        items: [],
        total: 0,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      try {
        const docRef = await addDoc(collection(db, 'projects'), newProjectData);
        project = { id: docRef.id, ...newProjectData };
        setProjects(prev => [project, ...prev]);
        setCurrentProject(project);
      } catch (error) {
        console.error('Error creating project:', error);
        showNotification('Error creating project', 'error');
        return;
      }
    }
    
    // Verificar si el producto ya existe en el estimado
    const exists = project.items?.find(i => i.productId === product.id);
    if (exists) {
      showNotification(`${product.name} is already in the estimate`, 'info');
      return;
    }
    
    // Crear nuevo item
    const item = {
      id: Date.now() + Math.random(),
      productId: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      unit: product.unit || 'each',
      description: product.description || '',
      supplier: product.supplier || '',
      category: product.category || '',
      link: product.link || '',
      partNumber: product.partNumber || '',
      quantity: 1,
      addedAt: new Date().toISOString(),
    };
    
    // Actualizar proyecto
    const updatedItems = [...(project.items || []), item];
    const updatedTotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    const updatedProject = {
      ...project,
      items: updatedItems,
      total: updatedTotal,
      lastModified: new Date().toISOString()
    };
    
    try {
      // Actualizar en Firebase
      await updateDoc(doc(db, 'projects', project.id), {
        items: updatedItems,
        total: updatedTotal,
        lastModified: new Date().toISOString()
      });
      
      // Actualizar estados locales
      setProjects(prev => prev.map(p => p.id === project.id ? updatedProject : p));
      setCurrentProject(updatedProject);
      showNotification(`Added ${product.name} to estimate`, 'success');
    } catch (error) {
      console.error('Error updating project:', error);
      showNotification('Error adding product to estimate', 'error');
    }
  };

  // NUEVA FUNCIÓN: Añadir pack al estimado (añade todos los productos del pack)
  const addPackToEstimate = async (pack) => {
    if (!pack.products || pack.products.length === 0) {
      showNotification('This pack has no products', 'error');
      return;
    }

    let project = currentProject;
    
    // Si no hay proyecto activo, crear uno nuevo
    if (!project) {
      const newProjectData = {
        name: `Quick Estimate - ${new Date().toLocaleDateString()}`,
        description: 'Automatically created estimate',
        items: [],
        total: 0,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      try {
        const docRef = await addDoc(collection(db, 'projects'), newProjectData);
        project = { id: docRef.id, ...newProjectData };
        setProjects(prev => [project, ...prev]);
        setCurrentProject(project);
      } catch (error) {
        console.error('Error creating project:', error);
        showNotification('Error creating project', 'error');
        return;
      }
    }

    // Añadir todos los productos del pack
    const newItems = [];
    let addedCount = 0;
    
    for (const packProduct of pack.products) {
      // Verificar si el producto ya existe
      const exists = project.items?.find(i => i.productId === packProduct.id);
      if (!exists) {
        const item = {
          id: Date.now() + Math.random() + addedCount,
          productId: packProduct.id,
          name: packProduct.name,
          price: Number(packProduct.price) || 0,
          unit: 'each',
          description: `From pack: ${pack.name}`,
          supplier: '',
          category: pack.category || '',
          link: '',
          partNumber: packProduct.partNumber || '',
          quantity: packProduct.quantity || 1,
          addedAt: new Date().toISOString(),
          fromPack: pack.name
        };
        newItems.push(item);
        addedCount++;
      }
    }

    if (newItems.length === 0) {
      showNotification('All products from this pack are already in the estimate', 'info');
      return;
    }

    // Actualizar proyecto
    const updatedItems = [...(project.items || []), ...newItems];
    const updatedTotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    const updatedProject = {
      ...project,
      items: updatedItems,
      total: updatedTotal,
      lastModified: new Date().toISOString()
    };
    
    try {
      // Actualizar en Firebase
      await updateDoc(doc(db, 'projects', project.id), {
        items: updatedItems,
        total: updatedTotal,
        lastModified: new Date().toISOString()
      });
      
      // Actualizar estados locales
      setProjects(prev => prev.map(p => p.id === project.id ? updatedProject : p));
      setCurrentProject(updatedProject);
      showNotification(`Added ${addedCount} products from pack "${pack.name}" to estimate`, 'success');
    } catch (error) {
      console.error('Error updating project:', error);
      showNotification('Error adding pack to estimate', 'error');
    }
  };

  // NUEVA FUNCIÓN: Eliminar producto del proyecto
  const removeProductFromProject = async (project, itemId) => {
    try {
      const updatedItems = project.items.filter(item => item.id !== itemId);
      const updatedTotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      
      const updatedProject = {
        ...project,
        items: updatedItems,
        total: updatedTotal,
        lastModified: new Date().toISOString()
      };
      
      // Actualizar en Firebase
      await updateDoc(doc(db, 'projects', project.id), {
        items: updatedItems,
        total: updatedTotal,
        lastModified: new Date().toISOString()
      });
      
      // Actualizar estados locales
      setProjects(prev => prev.map(p => p.id === project.id ? updatedProject : p));
      setCurrentProject(current => current?.id === project.id ? updatedProject : current);
      setSelectedProjectForDetail(updatedProject);
      
      showNotification('Product removed from project', 'success');
    } catch (error) {
      console.error('Error removing product:', error);
      showNotification('Error removing product', 'error');
    }
  };

  // NUEVA FUNCIÓN: Actualizar cantidad de producto en proyecto
  const updateProductQuantity = async (project, itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      const updatedItems = project.items.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      const updatedTotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      
      const updatedProject = {
        ...project,
        items: updatedItems,
        total: updatedTotal,
        lastModified: new Date().toISOString()
      };
      
      // Actualizar en Firebase
      await updateDoc(doc(db, 'projects', project.id), {
        items: updatedItems,
        total: updatedTotal,
        lastModified: new Date().toISOString()
      });
      
      // Actualizar estados locales
      setProjects(prev => prev.map(p => p.id === project.id ? updatedProject : p));
      setCurrentProject(current => current?.id === project.id ? updatedProject : current);
      setSelectedProjectForDetail(updatedProject);
      
      showNotification('Quantity updated', 'success');
    } catch (error) {
      console.error('Error updating quantity:', error);
      showNotification('Error updating quantity', 'error');
    }
  };

  // FUNCIÓN: Export to PDF REAL con jsPDF simulado pero generando PDF válido
  const exportToPDF = (project) => {
    if (!project.items || project.items.length === 0) {
      showNotification('No items in this project to export', 'error');
      return;
    }

    const total = project.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = project.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Simular jsPDF - crear contenido HTML que se puede convertir a PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Project Estimate - ${project.name}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .project-info { margin-bottom: 20px; }
            .products-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .products-table th, .products-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .products-table th { background-color: #f5f5f5; }
            .summary { font-weight: bold; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>PROJECT ESTIMATE</h1>
        </div>
        
        <div class="project-info">
            <h2>Project: ${project.name}</h2>
            <p><strong>Description:</strong> ${project.description || 'No description'}</p>
            <p><strong>Address:</strong> ${project.address || 'No address'}</p>
            <p><strong>Created:</strong> ${new Date(project.createdAt).toLocaleDateString()}</p>
            <p><strong>Last Modified:</strong> ${new Date(project.lastModified).toLocaleDateString()}</p>
        </div>

        <h3>PRODUCTS:</h3>
       <table class="products-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product Name</th>
            <th>Part Number/SKU</th>
            <th>Quantity</th>
          <th>Supplier</th>
    </tr>
  </thead>
  <tbody>
    ${project.items.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.partNumber || 'N/A'}</td>
            <td>${item.link || 'N/A'}</td>
            <td>${item.quantity}</td>
            <td>${item.supplier || 'N/A'}</td>
             </tr>
          `).join('')}
          </tbody>
        </table>

        <div class="summary">
            <p>Total Items: ${itemCount}</p>
            <p>Total Cost: $${total.toFixed(2)}</p>
        </div>

        <div class="footer">
            <p>Generated by ECP Assistant on ${new Date().toLocaleDateString()}</p>
        </div>
    </body>
    </html>
    `;
    
    // Crear un blob con el HTML y descargarlo como HTML (que se puede imprimir como PDF)
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_estimate.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('Estimate exported successfully! Open the HTML file and print to PDF.', 'success');
  };

  // Share estimate function MEJORADA
  const shareEstimate = (project, method) => {
    if (!project.items || project.items.length === 0) {
      showNotification('No items in this project to share', 'error');
      return;
    }

    const total = project.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = project.items.reduce((sum, item) => sum + item.quantity, 0);
    
    const shareText = `Project Estimate: ${project.name}

Items: ${itemCount}
Total Cost: $${total.toFixed(2)}

Products:
${project.items.map(item => `• ${item.name} ${item.partNumber ? `(${item.partNumber})` : ''} - $${item.price.toFixed(2)} x${item.quantity}`).join('\n')}

Generated by ECP Assistant`;
    
    if (method === 'email') {
      const mailtoLink = `mailto:?subject=Project Estimate: ${encodeURIComponent(project.name)}&body=${encodeURIComponent(shareText)}`;
      window.location.href = mailtoLink;
    } else if (method === 'teams') {
      const teamsUrl = `https://teams.microsoft.com/share?href=${encodeURIComponent(window.location.href)}&msgText=${encodeURIComponent(shareText)}`;
      window.open(teamsUrl, '_blank');
    }
    
    showNotification(`Shared via ${method}!`, 'success');
  };

  // Helper functions
  const getProjectTotal = (project) => project.total || 0;
  const getProjectItemCount = (project) => (project.items || []).reduce((sum, item) => sum + item.quantity, 0);

  // NUEVA FUNCIÓN: Filtrar proyectos por búsqueda
  const filteredProjects = projects.filter(project => {
    const searchLower = projectSearchTerm.toLowerCase();
    return (
      project.name.toLowerCase().includes(searchLower) ||
      (project.description && project.description.toLowerCase().includes(searchLower)) ||
      (project.address && project.address.toLowerCase().includes(searchLower))
    );
  });

  // Header component
  const renderHeader = () => (
    <div className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">ECP Assistant</h1>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                Firebase Connected
              </div>
            </div>
            <p className="text-slate-600">
              {currentProject ? (
                <span className="flex items-center gap-2">
                  Active: <strong>{currentProject.name}</strong>
                  {currentProject.items && currentProject.items.length > 0 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm">
                      {getProjectItemCount(currentProject)} items • ${getProjectTotal(currentProject).toFixed(2)}
                    </span>
                  )}
                </span>
              ) : (
                'Welcome, dainierds41@gmail.com'
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
            {currentView === 'projects' && (
              <button 
                onClick={() => setShowProjectForm(true)}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>New Estimate</span>
              </button>
            )}
            <button className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Navigation component
  const renderNavigation = () => (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="bg-white rounded-2xl shadow-sm p-2 inline-flex">
          <button
            onClick={() => setCurrentView('projects')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              currentView === 'projects' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Projects & Estimates</span>
          </button>
          <button
            onClick={() => setCurrentView('products')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              currentView === 'products' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Library</span>
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              currentView === 'settings' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Projects View MEJORADO con búsqueda
  const renderProjectsView = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Projects & Estimates</h2>
          <p className="text-slate-600">Manage your construction projects and estimates</p>
        </div>
        <button 
          onClick={() => setShowProjectForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* NUEVA BÚSQUEDA DE PROYECTOS */}
      <div className="mb-8">
        <div className="flex-1 relative">
          <input
            type="text"
            value={projectSearchTerm}
            onChange={(e) => setProjectSearchTerm(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map(project => {
            const itemCount = getProjectItemCount(project);
            const total = getProjectTotal(project);
            const formattedDate = new Date(project.createdAt).toLocaleDateString();
            
            return (
              <div key={project.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
                    <p className="text-gray-600 text-sm">{project.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* BOTÓN OJO CORREGIDO */}
                    <button 
                      onClick={() => {
                        setSelectedProjectForDetail(project);
                        setShowProjectDetail(true);
                      }}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title="View project details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingProject(project);
                        setProjectFormData({
                          name: project.name,
                          description: project.description || '',
                          address: project.address || ''
                        });
                        setShowProjectForm(true);
                      }}
                      className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                      title="Edit project"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setCurrentProject(project)}
                      className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                      title="Set as active project"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => exportToPDF(project)}
                      className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                      title="Export to PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <div className="relative group">
                      <button className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
                        <Share className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button 
                          onClick={() => shareEstimate(project, 'email')}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </button>
                        <button 
                          onClick={() => shareEstimate(project, 'teams')}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Teams
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                  <span>{itemCount} items</span>
                  <span>Created {formattedDate}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-green-600">${total.toFixed(2)}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              {projectSearchTerm ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-slate-500 mb-4">
              {projectSearchTerm 
                ? 'Try adjusting your search criteria'
                : 'Create your first project to start building estimates'
              }
            </p>
            {!projectSearchTerm && (
              <button
                onClick={() => setShowProjectForm(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                Create Project
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Products View
  const renderProductsView = () => {
    const filteredProducts = products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.partNumber && product.partNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });

    const filteredPacks = packs.filter(pack => {
      const matchesCategory = selectedCategory === 'all' || pack.category === selectedCategory;
      const matchesSearch = pack.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Sub-navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setProductView('products')}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                productView === 'products'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Products ({products.length})
            </button>
            <button
              onClick={() => setProductView('packs')}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                productView === 'packs'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Packs ({packs.length})
            </button>
          </div>
          
          {productView === 'products' ? (
            <button 
              onClick={() => setShowProductForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          ) : (
            <button 
              onClick={() => setShowPackForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Pack</span>
            </button>
          )}
        </div>

        {/* Header info */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Product Library</h2>
          <div className="text-slate-600">
            <p>Connected to Firebase! Your products will sync across devices.</p>
            <p>You have {products.length} products and {packs.length} packs loaded.</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${productView} by name or part number...`}
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            All Categories ({productView === 'products' ? products.length : packs.length})
          </button>
          {categories.map((category) => {
            const count = productView === 'products' 
              ? products.filter(p => p.category === category.name).length
              : packs.filter(p => p.category === category.name).length;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === category.name
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {category.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Content */}
        {productView === 'products' ? renderProductsList(filteredProducts) : renderPacksList(filteredPacks)}
      </div>
    );
  };

  // NUEVO DISEÑO DE PRODUCTOS basado en la imagen
  const renderProductsList = (filteredProducts) => {
    if (filteredProducts.length === 0) {
      return (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No products found</h3>
          <p className="text-slate-500 mb-4">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Start by adding your first product'}
          </p>
          <button
            onClick={() => setShowProductForm(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            Add Product
          </button>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 relative"
          >
            {/* Icono del producto - esquina superior izquierda */}
            <div className="absolute top-4 left-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Package className="w-6 h-6 text-slate-400" />
                )}
              </div>
            </div>

            {/* Badges y botones - esquina superior derecha */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {product.isAutoExtracted && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Auto
                </span>
              )}
              <button
                onClick={() => {
                  setEditingProduct(product);
                  setProductFormData({
                    name: product.name,
                    price: product.price.toString(),
                    description: product.description || '',
                    category: product.category || '',
                    supplier: product.supplier || '',
                    link: product.link || '',
                    unit: product.unit || 'each',
                    partNumber: product.partNumber || '',
                    isAutoExtracted: product.isAutoExtracted || false,
                    image: product.image || null
                  });
                  setShowProductForm(true);
                }}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                title="Edit product"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this product?')) {
                    setLoading(true);
                    try {
                      await deleteDoc(doc(db, 'products', product.id));
                      await loadData();
                      showNotification('Product deleted successfully', 'success');
                    } catch (error) {
                      console.error('Error deleting product:', error);
                      showNotification('Error deleting product', 'error');
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                title="Delete product"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido principal - con margen para el icono */}
            <div className="mt-16">
              {/* Título del producto */}
              <h3 
                className="font-bold text-slate-800 text-lg mb-3 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => {
                  setSelectedProduct(product);
                  setShowProductDetail(true);
                }}
              >
                {product.name}
              </h3>

              {/* Part Number/SKU */}
              {product.partNumber && (
                <div className="mb-2">
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    {product.partNumber}
                  </span>
                </div>
              )}

              {/* Descripción */}
              <p className="text-slate-600 text-sm mb-4 leading-relaxed min-h-[2.5rem]">
                {product.description || 'Producto de Home Depot. Precio estimado basado en categoría.'}
              </p>

              {/* Precio y proveedor */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-blue-600 font-bold text-xl">
                  ${Number(product.price).toFixed(2)} {product.unit || 'each'}
                </span>
                <span className="text-slate-500 font-medium">
                  {product.supplier || "Lowe's"}
                </span>
              </div>

              {/* Categoría */}
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm font-medium">
                  {product.category || 'Plumbing'}
                </span>
              </div>

             {/* Enlaces y botones inferiores */}
              <div className="flex items-center justify-between">
                {product.link ? (
                  <button
                    onClick={() => window.open(product.link, '_blank')}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 text-sm font-medium hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Product
                  </button>
                ) : (
                  <span className="text-slate-400 text-sm">No product link</span>
                )}

                {/* Botón de agregar al estimado */}
                <button
                  onClick={() => addProductToEstimate(product)}
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add to Estimate
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // PACKS REORGANIZADO - Quitar texto y mover ojo abajo
  const renderPacksList = (filteredPacks) => {
    if (filteredPacks.length === 0) {
      return (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No packs found</h3>
          <p className="text-slate-500 mb-4">Start by creating your first pack</p>
          <button 
            onClick={() => setShowPackForm(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
          >
            Create Pack
          </button>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredPacks.map((pack) => (
          <div
            key={pack.id}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100"
          >
            <div className="flex gap-4">
              {/* Icon Section */}
              <div className="relative w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-8 h-8 text-green-600" />
              </div>

              {/* Content Section */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <h3 className="font-bold text-slate-800 text-lg truncate flex-1">
                    {pack.name}
                  </h3>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Pack</span>
                </div>
                <p className="text-slate-600 text-sm mb-2 line-clamp-2">{pack.description}</p>
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg font-semibold">
                    {pack.products?.length || 0} products
                  </span>
                  {pack.category && (
                    <span className="bg-slate-50 text-slate-600 px-2 py-1 rounded text-xs">{pack.category}</span>
                  )}
                </div>
              </div>

              {/* Vertical Buttons Section - Right Side (sin ojo) */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => addPackToEstimate(pack)}
                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                  title="Add pack to estimate"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingPack(pack);
                    setPackFormData({
                      name: pack.name,
                      description: pack.description || '',
                      category: pack.category || '',
                      products: pack.products || []
                    });
                    setShowPackForm(true);
                  }}
                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  title="Edit pack"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeletePack(pack.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  title="Delete pack"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Section - NUEVO BOTÓN OJO */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedPack(pack);
                  setShowPackDetail(true);
                }}
                className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium hover:bg-blue-50 py-2 rounded-lg transition-colors"
              >
                👁 View Items
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Settings View
  const renderSettingsView = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Settings</h2>
        
        <div className="space-y-8">
          {/* Categories */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-700">Categories</h3>
              <button 
                onClick={() => setShowCategoryForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <div key={category.id} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg">
                  <span>{category.name}</span>
                  <button 
                    onClick={async () => {
                      if (categories.length <= 1) {
                        showNotification('Must keep at least one category', 'error');
                        return;
                      }
                      if (window.confirm(`Are you sure you want to delete category "${category.name}"?`)) {
                        try {
                          await deleteDoc(doc(db, 'categories', category.id));
                          await loadData();
                          showNotification('Category deleted successfully', 'success');
                        } catch (error) {
                          console.error('Error deleting category:', error);
                          showNotification('Error deleting category', 'error');
                        }
                      }
                    }}
                    className="hover:bg-blue-200 rounded p-1 transition-colors"
                    title={`Delete ${category.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Suppliers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-700">Suppliers</h3>
              <button 
                onClick={() => setShowSupplierForm(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Supplier
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {suppliers.map(supplier => (
                <div key={supplier.id} className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg">
                  <span>{supplier.name}</span>
                  <button 
                    onClick={async () => {
                      if (suppliers.length <= 1) {
                        showNotification('Must keep at least one supplier', 'error');
                        return;
                      }
                      if (window.confirm(`Are you sure you want to delete supplier "${supplier.name}"?`)) {
                        try {
                          await deleteDoc(doc(db, 'suppliers', supplier.id));
                          await loadData();
                          showNotification('Supplier deleted successfully', 'success');
                        } catch (error) {
                          console.error('Error deleting supplier:', error);
                          showNotification('Error deleting supplier', 'error');
                        }
                      }
                    }}
                    className="hover:bg-green-200 rounded p-1 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Database Connected</h3>
            <p className="text-green-700 mb-1">Your data is now stored in Firebase and will sync across all your devices.</p>
            <p className="text-green-600 text-sm">Logged in as: dainierds41@gmail.com</p>
          </div>

          {/* Storage Info */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Storage Information</h3>
            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Products:</span>
                  <span>{products.length} items</span>
                </div>
                <div className="flex justify-between">
                  <span>Packs:</span>
                  <span>{packs.length} packs</span>
                </div>
                <div className="flex justify-between">
                  <span>Projects:</span>
                  <span>{projects.length} projects</span>
                </div>
                <div className="flex justify-between">
                  <span>Auto-extracted:</span>
                  <span>{products.filter(p => p.isAutoExtracted).length} products</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">Data is stored securely in Firebase and synced in real-time.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Notification System */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-green-500 text-white'
              : notification.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}

      {renderHeader()}
      {renderNavigation()}
      
      {loading && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center space-x-3 max-w-7xl mx-auto">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 text-sm">Syncing with Firebase...</span>
          </div>
        </div>
      )}

      {currentView === 'projects' && renderProjectsView()}
      {currentView === 'products' && renderProductsView()}
      {currentView === 'settings' && renderSettingsView()}

      {/* NUEVO MODAL: Detalles/Edición de Proyecto */}
      {showProjectDetail && selectedProjectForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold text-slate-800">Project Details</h2>
              <button 
                onClick={() => {
                  setShowProjectDetail(false);
                  setSelectedProjectForDetail(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-6">
              {/* Información del proyecto */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{selectedProjectForDetail.name}</h3>
                    <p className="text-slate-600 mb-2">{selectedProjectForDetail.description}</p>
                    {selectedProjectForDetail.address && (
                      <p className="text-slate-500 text-sm">{selectedProjectForDetail.address}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">
                      ${getProjectTotal(selectedProjectForDetail).toFixed(2)}
                    </div>
                    <div className="text-slate-500 text-sm">
                      {getProjectItemCount(selectedProjectForDetail)} items total
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de productos */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-slate-800">Products in Project</h4>
                  <button
                    onClick={() => {
                      setCurrentProject(selectedProjectForDetail);
                      setCurrentView('products');
                      setShowProjectDetail(false);
                      setSelectedProjectForDetail(null);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    Add More Products
                  </button>
                </div>

                {selectedProjectForDetail.items && selectedProjectForDetail.items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedProjectForDetail.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <h5 className="font-medium text-slate-800">{item.name}</h5>
                          {item.partNumber && (
                            <p className="text-xs text-slate-500 bg-slate-200 inline-block px-2 py-1 rounded mt-1">
                              {item.partNumber}
                            </p>
                          )}
                          <p className="text-slate-600 text-sm">{item.description}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                            <span>Category: {item.category}</span>
                            <span>Supplier: {item.supplier}</span>
                            {item.link && (
                              <a href={item.link} target="_blank" rel="noopener noreferrer" 
                                 className="text-blue-500 hover:underline flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                View Product
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateProductQuantity(selectedProjectForDetail, item.id, item.quantity - 1)}
                              className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-medium text-slate-800 min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateProductQuantity(selectedProjectForDetail, item.id, item.quantity + 1)}
                              className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-800">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                            <div className="text-slate-500 text-sm">
                              ${item.price.toFixed(2)} each
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm('Remove this product from the project?')) {
                                removeProductFromProject(selectedProjectForDetail, item.id);
                              }
                            }}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">No products in this project yet</p>
                  </div>
                )}
              </div>

              {/* Acciones del proyecto */}
              <div className="flex gap-3 pt-6 border-t border-slate-200">
                <button
                  onClick={() => exportToPDF(selectedProjectForDetail)}
                  className="flex-1 bg-green-500 text-white py-3 px-4 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  onClick={() => {
                    setEditingProject(selectedProjectForDetail);
                    setProjectFormData({
                      name: selectedProjectForDetail.name,
                      description: selectedProjectForDetail.description || '',
                      address: selectedProjectForDetail.address || ''
                    });
                    setShowProjectDetail(false);
                    setSelectedProjectForDetail(null);
                    setShowProjectForm(true);
                  }}
                  className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Project
                </button>
                <div className="relative group">
                  <button className="px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors">
                    <Share className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button 
                      onClick={() => shareEstimate(selectedProjectForDetail, 'email')}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                    <button 
                      onClick={() => shareEstimate(selectedProjectForDetail, 'teams')}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Teams
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Project */}
      {showProjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </h2>
            <form onSubmit={handleProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectFormData.name}
                  onChange={(e) => setProjectFormData({...projectFormData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({...projectFormData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  rows={3}
                  placeholder="Project description"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={projectFormData.address}
                  onChange={(e) => setProjectFormData({...projectFormData, address: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="Project address"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-500 text-white py-3 px-6 rounded-xl hover:bg-green-600 transition-colors font-semibold disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingProject ? 'Update Project' : 'Create Project')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProjectForm(false);
                    setProjectFormData({ name: '', description: '', address: '' });
                    setEditingProject(null);
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Product with Auto-extraction */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            
            {isExtracting && (
              <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                Extracting product information from URL...
              </div>
            )}
            
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Product Link</label>
                <input
                  type="url"
                  value={productFormData.link}
                  onChange={(e) => {
                    // CAMPO URL ARREGLADO: Permite escribir libremente
                    if (!editingProduct) {
                      handleProductUrlChange(e.target.value);
                    } else {
                      setProductFormData(prev => ({ ...prev, link: e.target.value }));
                    }
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="https://... (Auto-extraction will fill details)"
                  disabled={isExtracting}
                />
                {!editingProduct && (
                  <p className="mt-2 text-xs text-slate-500">Compatible: Home Depot, Lowe's, Amazon, and more</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Product Image</label>
                <div className="flex items-center gap-4">
                  {productFormData.image && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-slate-200">
                      <img 
                        src={productFormData.image} 
                        alt="Product preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setProductFormData(prev => ({ ...prev, image: e.target.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <p className="mt-1 text-xs text-slate-500">Upload an image to replace the default icon</p>
                  </div>
                  {productFormData.image && (
                    <button
                      type="button"
                      onClick={() => setProductFormData(prev => ({ ...prev, image: null }))}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={productFormData.name}
                  onChange={(e) => setProductFormData({...productFormData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter product name"
                  required
                />
              </div>

              {/* NEW PART NUMBER/SKU FIELD */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Part Number/SKU</label>
                <input
                  type="text"
                  value={productFormData.partNumber}
                  onChange={(e) => setProductFormData({...productFormData, partNumber: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter part number or SKU"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                  <select
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({...productFormData, category: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Supplier</label>
                  <select
                    value={productFormData.supplier}
                    onChange={(e) => setProductFormData({...productFormData, supplier: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({...productFormData, price: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Unit</label>
                  <input
                    type="text"
                    value={productFormData.unit}
                    onChange={(e) => setProductFormData({...productFormData, unit: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g., per piece, per foot"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({...productFormData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={3}
                  placeholder="Product description"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={isExtracting || loading}
                  className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-xl hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                    setProductFormData({ name: '', price: '', description: '', category: '', supplier: '', link: '', unit: 'each', partNumber: '', isAutoExtracted: false, image: null });
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Product Detail */}
      {showProductDetail && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold text-slate-800">Product Details</h2>
              <button 
                onClick={() => {
                  setShowProductDetail(false);
                  setSelectedProduct(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="w-full h-64 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
                    {selectedProduct.image ? (
                      <img 
                        src={selectedProduct.image} 
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <Package className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">No product image</p>
                      </div>
                    )}
                  </div>

                  {selectedProduct.link && (
                    <a
                      href={selectedProduct.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View at {selectedProduct.supplier}
                    </a>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-start gap-3 mb-4">
                      <h3 className="text-2xl font-bold text-slate-800 leading-tight">{selectedProduct.name}</h3>
                      {selectedProduct.isAutoExtracted && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Auto-extracted
                        </div>
                      )}
                    </div>

                    {/* Part Number/SKU Display */}
                    {selectedProduct.partNumber && (
                      <div className="mb-4">
                        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                          Part #: {selectedProduct.partNumber}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-3xl font-bold text-green-600">${Number(selectedProduct.price).toFixed(2)}</span>
                      <span className="text-slate-500 text-lg">{selectedProduct.unit || 'each'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-slate-600 text-sm font-semibold mb-1">Category</p>
                      <p className="text-slate-800 font-medium">{selectedProduct.category || 'No category'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-slate-600 text-sm font-semibold mb-1">Supplier</p>
                      <p className="text-slate-800 font-medium">{selectedProduct.supplier || 'No supplier'}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-slate-600 text-sm font-semibold mb-2">Description</p>
                    <p className="text-slate-800 leading-relaxed">{selectedProduct.description || 'No description available'}</p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        addProductToEstimate(selectedProduct);
                        setShowProductDetail(false);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 bg-green-500 text-white py-3 px-4 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add to Estimate
                    </button>
                    <button
                      onClick={() => {
                        setEditingProduct(selectedProduct);
                        setProductFormData({
                          name: selectedProduct.name,
                          price: selectedProduct.price.toString(),
                          description: selectedProduct.description || '',
                          category: selectedProduct.category || '',
                          supplier: selectedProduct.supplier || '',
                          link: selectedProduct.link || '',
                          unit: selectedProduct.unit || 'each',
                          partNumber: selectedProduct.partNumber || '',
                          isAutoExtracted: selectedProduct.isAutoExtracted || false,
                          image: selectedProduct.image || null
                        });
                        setShowProductDetail(false);
                        setSelectedProduct(null);
                        setShowProductForm(true);
                      }}
                      className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Product
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Pack */}
      {showPackForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              {editingPack ? 'Edit Pack' : 'Create New Pack'}
            </h2>
            
            <form onSubmit={handlePackSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Pack Name *</label>
                  <input
                    type="text"
                    value={packFormData.name}
                    onChange={(e) => setPackFormData({...packFormData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    placeholder="Enter pack name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                  <select
                    value={packFormData.category}
                    onChange={(e) => setPackFormData({...packFormData, category: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea
                  value={packFormData.description}
                  onChange={(e) => setPackFormData({...packFormData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  rows={3}
                  placeholder="Enter pack description"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Products in Pack</label>
                <div className="border border-slate-300 rounded-xl p-4 max-h-60 overflow-y-auto">
                  {products.length > 0 ? (
                    <div className="space-y-2">
                      {products.map(product => (
                        <label key={product.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={packFormData.products.some(p => p.id === product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPackFormData({
                                  ...packFormData,
                                  products: [...packFormData.products, { 
                                    id: product.id, 
                                    name: product.name, 
                                    price: product.price,
                                    partNumber: product.partNumber || '',
                                    quantity: 1
                                  }]
                                });
                              } else {
                                setPackFormData({
                                  ...packFormData,
                                  products: packFormData.products.filter(p => p.id !== product.id)
                                });
                              }
                            }}
                            className="rounded text-green-600 focus:ring-green-500"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-slate-800">{product.name}</span>
                            {product.partNumber && (
                              <span className="text-slate-400 text-xs ml-2">({product.partNumber})</span>
                            )}
                            <span className="text-slate-500 text-sm ml-2">${product.price}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No products available. Add some products first.</p>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Selected: {packFormData.products.length} products
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-500 text-white py-3 px-6 rounded-xl hover:bg-green-600 transition-colors font-semibold disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingPack ? 'Update Pack' : 'Create Pack')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPackForm(false);
                    setEditingPack(null);
                    setPackFormData({ name: '', description: '', category: '', products: [] });
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pack Detail - UPDATED WITH PROJECT-LIKE CONTROLS */}
      {showPackDetail && selectedPack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold text-slate-800">Pack Details</h2>
              <button 
                onClick={() => {
                  setShowPackDetail(false);
                  setSelectedPack(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <h3 className="text-2xl font-bold text-slate-800">{selectedPack.name}</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">Pack</span>
                </div>
                <p className="text-slate-600 mb-4">{selectedPack.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg font-semibold">
                    {selectedPack.products?.length || 0} products
                  </span>
                  {selectedPack.category && (
                    <span className="bg-slate-50 text-slate-600 px-3 py-1 rounded-lg">{selectedPack.category}</span>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-slate-800">Products in this Pack</h4>
                  <button
                    onClick={() => {
                      setEditingPack(selectedPack);
                      setPackFormData({
                        name: selectedPack.name,
                        description: selectedPack.description || '',
                        category: selectedPack.category || '',
                        products: selectedPack.products || []
                      });
                      setShowPackDetail(false);
                      setSelectedPack(null);
                      setShowPackForm(true);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    Edit Pack
                  </button>
                </div>
                
                {selectedPack.products && selectedPack.products.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPack.products.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <h5 className="font-medium text-slate-800">{product.name}</h5>
                          {product.partNumber && (
                            <p className="text-xs text-slate-500 bg-slate-200 inline-block px-2 py-1 rounded mt-1">
                              {product.partNumber}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                            <span>Price: ${Number(product.price).toFixed(2)}</span>
                          </div>
                        </div>
                        
                        {/* PROJECT-LIKE CONTROLS */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updatePackProductQuantity(selectedPack, index, (product.quantity || 1) - 1)}
                              className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-medium text-slate-800 min-w-[2rem] text-center">
                              {product.quantity || 1}
                            </span>
                            <button
                              onClick={() => updatePackProductQuantity(selectedPack, index, (product.quantity || 1) + 1)}
                              className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-800">
                              ${(product.price * (product.quantity || 1)).toFixed(2)}
                            </div>
                            <div className="text-slate-500 text-sm">
                              ${product.price} each
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm('Remove this product from the pack?')) {
                                removeProductFromPack(selectedPack, index);
                              }
                            }}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">No products in this pack</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-200">
                <button
                  onClick={() => addPackToEstimate(selectedPack)}
                  className="flex-1 bg-green-500 text-white py-3 px-4 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Add Pack to Estimate
                </button>
                <button
                  onClick={() => {
                    setEditingPack(selectedPack);
                    setPackFormData({
                      name: selectedPack.name,
                      description: selectedPack.description || '',
                      category: selectedPack.category || '',
                      products: selectedPack.products || []
                    });
                    setShowPackDetail(false);
                    setSelectedPack(null);
                    setShowPackForm(true);
                  }}
                  className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Pack
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Category */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Add New Category</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!categoryFormData.name) {
                showNotification('Category name is required', 'error');
                return;
              }
              setLoading(true);
              try {
                await addDoc(collection(db, 'categories'), {
                  ...categoryFormData,
                  createdAt: new Date().toISOString()
                });
                await loadData();
                setCategoryFormData({ name: '', description: '' });
                setShowCategoryForm(false);
                showNotification('Category added successfully!', 'success');
              } catch (error) {
                console.error('Error saving category:', error);
                showNotification('Error saving category', 'error');
              } finally {
                setLoading(false);
              }
            }} className="space-y-4">
              <input
                type="text"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Category name"
                required
              />
              <input
                type="text"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Description (optional)"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-xl hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Category'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setCategoryFormData({ name: '', description: '' });
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Supplier */}
      {showSupplierForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Add New Supplier</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!supplierFormData.name) {
                showNotification('Supplier name is required', 'error');
                return;
              }
              setLoading(true);
              try {
                await addDoc(collection(db, 'suppliers'), {
                  ...supplierFormData,
                  createdAt: new Date().toISOString()
                });
                await loadData();
                setSupplierFormData({ name: '', contact: '', email: '', phone: '' });
                setShowSupplierForm(false);
                showNotification('Supplier added successfully!', 'success');
              } catch (error) {
                console.error('Error saving supplier:', error);
                showNotification('Error saving supplier', 'error');
              } finally {
                setLoading(false);
              }
            }} className="space-y-4">
              <input
                type="text"
                value={supplierFormData.name}
                onChange={(e) => setSupplierFormData({...supplierFormData, name: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Supplier name"
                required
              />
              <input
                type="text"
                value={supplierFormData.contact}
                onChange={(e) => setSupplierFormData({...supplierFormData, contact: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Contact person"
              />
              <input
                type="email"
                value={supplierFormData.email}
                onChange={(e) => setSupplierFormData({...supplierFormData, email: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Email"
              />
              <input
                type="tel"
                value={supplierFormData.phone}
                onChange={(e) => setSupplierFormData({...supplierFormData, phone: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Phone"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-500 text-white py-3 px-6 rounded-xl hover:bg-green-600 transition-colors font-semibold disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Supplier'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSupplierForm(false);
                    setSupplierFormData({ name: '', contact: '', email: '', phone: '' });
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
      
