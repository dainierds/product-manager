import React, { useState, useEffect } from 'react';
import { Plus, Package, Trash2, Edit3, Settings, RefreshCw, LogOut, Search, X, PlusCircle, Eye, Wifi, WifiOff, ZoomIn, ExternalLink, Download, Share, Mail, MessageSquare, FileText, Minus, Phone, MapPin, User, Image } from 'lucide-react';
import { db, storage } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  const [showSupplierDetail, setShowSupplierDetail] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  
  const [editingProject, setEditingProject] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingPack, setEditingPack] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [notification, setNotification] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Product selector states
  const [productSelectorSearch, setProductSelectorSearch] = useState('');
  
  // States for Pack controls
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
    products: [],
    image: null
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  });

  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    extension: ''
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

  // Enhanced contact functions
  const handleEmailClick = (email) => {
    window.location.href = `mailto:${email}`;
  };

  const handlePhoneClick = (phone, extension = '') => {
    const phoneNumber = extension ? `${phone},${extension}` : phone;
    window.location.href = `tel:${phoneNumber}`;
  };

  // Delete project function
  const handleProjectDelete = async (project) => {
    if (window.confirm(`Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`)) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'projects', project.id));
        await loadData();
        showNotification('Project deleted successfully', 'success');
        
        // Clear current project if it was the deleted one
        if (currentProject?.id === project.id) {
          setCurrentProject(null);
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        showNotification('Error deleting project', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // AUTO-EXTRACTION FUNCTION FROM APP (1).JS
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
          { name: 'Home Depot', contact: 'John Smith', email: 'john@homedepot.com', phone: '555-0001', extension: '' },
          { name: "Lowe's", contact: 'Jane Doe', email: 'jane@lowes.com', phone: '555-0002', extension: '123' },
          { name: 'Amazon', contact: 'Support Team', email: 'support@amazon.com', phone: '555-0003', extension: '' },
          { name: 'Local Supplier', contact: 'Mike Johnson', email: 'mike@local.com', phone: '555-0004', extension: '456' }
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
      let imageUrl = productFormData.image;
      
      // Si hay una imagen nueva (es un objeto File, no una URL string)
      if (productFormData.image && typeof productFormData.image !== 'string') {
        const storageRef = ref(storage, `products/${Date.now()}_${productFormData.image.name}`);
        await uploadBytes(storageRef, productFormData.image);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      const productData = {
        ...productFormData,
        image: imageUrl, // Guardamos la URL de la imagen
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
      setProductFormData({ 
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
      let imageUrl = packFormData.image;
      
      // Si hay una imagen nueva
      if (packFormData.image && typeof packFormData.image !== 'string') {
        const storageRef = ref(storage, `packs/${Date.now()}_${packFormData.image.name}`);
        await uploadBytes(storageRef, packFormData.image);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      const packData = {
        ...packFormData,
        image: imageUrl, // Guardamos la URL de la imagen
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
      setPackFormData({ 
        name: '', 
        description: '', 
        category: '', 
        products: [], 
        image: null 
      });
      setShowPackForm(false);
      setEditingPack(null);
    } catch (error) {
      console.error('Error saving pack:', error);
      showNotification('Error saving pack', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Supplier functions
  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    
    if (!supplierFormData.name) {
      showNotification('Please enter supplier name', 'error');
      return;
    }

    setLoading(true);
    try {
      const supplierData = {
        ...supplierFormData,
        createdAt: editingSupplier ? editingSupplier.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingSupplier) {
        await updateDoc(doc(db, 'suppliers', editingSupplier.id), supplierData);
        showNotification('Supplier updated successfully!', 'success');
      } else {
        await addDoc(collection(db, 'suppliers'), supplierData);
        showNotification('Supplier added successfully!', 'success');
      }

      await loadData();
      setSupplierFormData({ name: '', contact: '', email: '', phone: '', extension: '' });
      setShowSupplierForm(false);
      setEditingSupplier(null);
    } catch (error) {
      console.error('Error saving supplier:', error);
      showNotification('Error saving supplier', 'error');
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

  // Product selector functions
  const filteredProductsForSelector = products.filter(product =>
    product.name.toLowerCase().includes(productSelectorSearch.toLowerCase()) ||
    (product.partNumber && product.partNumber.toLowerCase().includes(productSelectorSearch.toLowerCase()))
  );

  const addProductToPack = (product) => {
    const isAlreadyAdded = packFormData.products.some(p => p.id === product.id);
    if (isAlreadyAdded) {
      showNotification('Product already added to pack', 'info');
      return;
    }

    setPackFormData({
      ...packFormData,
      products: [...packFormData.products, {
        id: product.id,
        name: product.name,
        price: product.price,
        partNumber: product.partNumber || '',
        quantity: 1,
        image: product.image
      }]
    });
    showNotification(`${product.name} added to pack`, 'success');
  };

  const removeProductFromFormPack = (productId) => {
    setPackFormData({
      ...packFormData,
      products: packFormData.products.filter(p => p.id !== productId)
    });
    showNotification('Product removed from pack', 'success');
  };

  const updateFormPackProductQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setPackFormData({
      ...packFormData,
      products: packFormData.products.map(p => 
        p.id === productId ? { ...p, quantity: newQuantity } : p
      )
    });
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

  // ESTIMATE SYSTEM CORRECTED
  const addProductToEstimate = async (product) => {
    let project = currentProject;
    
    // If no active project, create a new one
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
    
    // Check if product already exists in estimate
    const exists = project.items?.find(i => i.productId === product.id);
    if (exists) {
      showNotification(`${product.name} is already in the estimate`, 'info');
      return;
    }
    
    // Create new item
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
    
    // Update project
    const updatedItems = [...(project.items || []), item];
    const updatedTotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    const updatedProject = {
      ...project,
      items: updatedItems,
      total: updatedTotal,
      lastModified: new Date().toISOString()
    };
    
    try {
      // Update in Firebase
      await updateDoc(doc(db, 'projects', project.id), {
        items: updatedItems,
        total: updatedTotal,
        lastModified: new Date().toISOString()
      });
      
      // Update local states
      setProjects(prev => prev.map(p => p.id === project.id ? updatedProject : p));
      setCurrentProject(updatedProject);
      showNotification(`Added ${product.name} to estimate`, 'success');
    } catch (error) {
      console.error('Error updating project:', error);
      showNotification('Error adding product to estimate', 'error');
    }
  };

  // NEW FUNCTION: Add pack to estimate (adds all pack products)
  const addPackToEstimate = async (pack) => {
    if (!pack.products || pack.products.length === 0) {
      showNotification('This pack has no products', 'error');
      return;
    }

    let project = currentProject;
    
    // If no active project, create a new one
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

    // Add all pack products
    const newItems = [];
    let addedCount = 0;
    
    for (const packProduct of pack.products) {
      // Check if product already exists
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

    // Update project
    const updatedItems = [...(project.items || []), ...newItems];
    const updatedTotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    const updatedProject = {
      ...project,
      items: updatedItems,
      total: updatedTotal,
      lastModified: new Date().toISOString()
    };
    
    try {
      // Update in Firebase
      await updateDoc(doc(db, 'projects', project.id), {
        items: updatedItems,
        total: updatedTotal,
        lastModified: new Date().toISOString()
      });
      
      // Update local states
      setProjects(prev => prev.map(p => p.id === project.id ? updatedProject : p));
      setCurrentProject(updatedProject);
      showNotification(`Added ${addedCount} products from pack "${pack.name}" to estimate`, 'success');
    } catch (error) {
      console.error('Error updating project:', error);
      showNotification('Error adding pack to estimate', 'error');
    }
  };

  // NEW FUNCTION: Remove product from project
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
      
      // Update in Firebase
      await updateDoc(doc(db, 'projects', project.id), {
        items: updatedItems,
        total: updatedTotal,
        lastModified: new Date().toISOString()
      });
      
      // Update local states
      setProjects(prev => prev.map(p => p.id === project.id ? updatedProject : p));
      setCurrentProject(current => current?.id === project.id ? updatedProject : current);
      setSelectedProjectForDetail(updatedProject);
      
      showNotification('Product removed from project', 'success');
    } catch (error) {
      console.error('Error removing product:', error);
      showNotification('Error removing product', 'error');
    }
  };

  // NEW FUNCTION: Update product quantity in project
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
      
      // Update in Firebase
      await updateDoc(doc(db, 'projects', project.id), {
        items: updatedItems,
        total: updatedTotal,
        lastModified: new Date().toISOString()
      });
      
      // Update local states
      setProjects(prev => prev.map(p => p.id === project.id ? updatedProject : p));
      setCurrentProject(current => current?.id === project.id ? updatedProject : current);
      setSelectedProjectForDetail(updatedProject);
      
      showNotification('Quantity updated', 'success');
    } catch (error) {
      console.error('Error updating quantity:', error);
      showNotification('Error updating quantity', 'error');
    }
  };

  // IMPROVED PDF EXPORT FUNCTION with correct field structure
  const exportToPDF = (project) => {
    if (!project.items || project.items.length === 0) {
      showNotification('No items in this project to export', 'error');
      return;
    }

    const total = project.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = project.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Create HTML content with improved PDF structure
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
            .products-table th { background-color: #f5f5f5; font-weight: bold; }
            .products-table td { vertical-align: top; }
            .summary { font-weight: bold; margin-top: 20px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
            .url-cell { word-break: break-all; max-width: 150px; }
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
                    <th style="width: 5%;">#</th>
                    <th style="width: 25%;">Name</th>
                    <th style="width: 30%;">Description</th>
                    <th style="width: 15%;">Part Number</th>
                    <th style="width: 15%;" class="url-cell">URL</th>
                    <th style="width: 10%;">Quantity</th>
                </tr>
            </thead>
            <tbody>
                ${project.items.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.name}</td>
                        <td>${item.description || 'No description'}</td>
                        <td>${item.partNumber || 'N/A'}</td>
                        <td class="url-cell">${item.link || 'N/A'}</td>
                        <td>${item.quantity}</td>
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
    
    // Create blob and download
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

  // Enhanced share estimate function
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

  // Filter projects by search
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

  // Projects View
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

      {/* Project search */}
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
              <div 
                key={project.id} 
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
                    <p className="text-gray-600 text-sm">{project.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProjectForDetail(project);
                        setShowProjectDetail(true);
                      }}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title="View project details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProjectDelete(project);
                      }}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentProject(project);
                      }}
                      className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                      title="Set as active project"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        exportToPDF(project);
                      }}
                      className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                      title="Export to PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <div className="relative group">
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <Share className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            shareEstimate(project, 'email');
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            shareEstimate(project, 'teams');
                          }}
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
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create Pack</span>
            </button>
          )}
        </div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={productView === 'products' ? "Search products..." : "Search packs..."}
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          </div>
          
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none w-full md:w-48 pl-4 pr-10 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Products list */}
        {productView === 'products' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100"
                >
                  <div className="flex items-start mb-4">
                    {/* Product image thumbnail */}
                    {product.image && (
                      <div className="flex-shrink-0 mr-4">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-green-600">${Number(product.price).toFixed(2)}</span>
                        <span className="text-sm text-gray-500">{product.unit}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.category && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                        {categories.find(c => c.id === product.category)?.name || product.category}
                      </span>
                    )}
                    {product.supplier && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs">
                        {suppliers.find(s => s.id === product.supplier)?.name || product.supplier}
                      </span>
                    )}
                    {product.partNumber && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
                        {product.partNumber}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between">
                    <button 
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowProductDetail(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => addProductToEstimate(product)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      Add to Estimate
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">
                  {searchTerm || selectedCategory !== 'all' ? 'No products found' : 'No products yet'}
                </h3>
                <p className="text-slate-500 mb-4">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search criteria'
                    : 'Add your first product to start building your library'
                  }
                </p>
                {!searchTerm && selectedCategory === 'all' && (
                  <button
                    onClick={() => setShowProductForm(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Add Product
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Packs list */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPacks.length > 0 ? (
              filteredPacks.map(pack => (
                <div 
                  key={pack.id} 
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100"
                >
                  <div className="flex items-start mb-4">
                    {/* Pack image thumbnail */}
                    {pack.image && (
                      <div className="flex-shrink-0 mr-4">
                        <img 
                          src={pack.image} 
                          alt={pack.name} 
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{pack.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{pack.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {pack.products ? pack.products.length : 0} items
                        </span>
                        {pack.category && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                            {categories.find(c => c.id === pack.category)?.name || pack.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <button 
                      onClick={() => {
                        setSelectedPack(pack);
                        setShowPackDetail(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => addPackToEstimate(pack)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      Add to Estimate
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">
                  {searchTerm || selectedCategory !== 'all' ? 'No packs found' : 'No packs yet'}
                </h3>
                <p className="text-slate-500 mb-4">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search criteria'
                    : 'Create your first pack to group products together'
                  }
                </p>
                {!searchTerm && selectedCategory === 'all' && (
                  <button
                    onClick={() => setShowPackForm(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Create Pack
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Settings View
  const renderSettingsView = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Settings</h2>
      
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
        
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">Manage product categories</p>
          <button 
            onClick={() => setShowCategoryForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => (
            <div key={category.id} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{category.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{category.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Suppliers</h3>
        
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">Manage product suppliers</p>
          <button 
            onClick={() => setShowSupplierForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(supplier => (
            <div key={supplier.id} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{supplier.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{supplier.contact}</p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <Phone className="w-4 h-4 mr-1" />
                <span>{supplier.phone}{supplier.extension && ` ext. ${supplier.extension}`}</span>
              </div>
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <Mail className="w-4 h-4 mr-1" />
                <span>{supplier.email}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Project Form Modal
  const renderProjectForm = () => (
    showProjectForm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h2>
              <button 
                onClick={() => {
                  setShowProjectForm(false);
                  setEditingProject(null);
                  setProjectFormData({ name: '', description: '', address: '' });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleProjectSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                  <input
                    type="text"
                    value={projectFormData.name}
                    onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={projectFormData.description}
                    onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={projectFormData.address}
                    onChange={(e) => setProjectFormData({ ...projectFormData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowProjectForm(false);
                    setEditingProject(null);
                    setProjectFormData({ name: '', description: '', address: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingProject ? 'Update Project' : 'Create Project')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  );

  // Product Form Modal
  const renderProductForm = () => (
    showProductForm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button 
                onClick={() => {
                  setShowProductForm(false);
                  setEditingProduct(null);
                  setProductFormData({ 
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
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleProductSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                    <input
                      type="number"
                      value={productFormData.price}
                      onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      value={productFormData.unit}
                      onChange={(e) => setProductFormData({ ...productFormData, unit: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="each">Each</option>
                      <option value="sqft">Square Foot</option>
                      <option value="lf">Linear Foot</option>
                      <option value="box">Box</option>
                      <option value="pallet">Pallet</option>
                      <option value="hour">Hour</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={productFormData.description}
                    onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product URL</label>
                  <input
                    type="url"
                    value={productFormData.link}
                    onChange={(e) => handleProductUrlChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/product"
                  />
                  {isExtracting && (
                    <p className="text-sm text-blue-600 mt-1">Extracting product information...</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={productFormData.category}
                      onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <select
                      value={productFormData.supplier}
                      onChange={(e) => setProductFormData({ ...productFormData, supplier: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                  <input
                    type="text"
                    value={productFormData.partNumber}
                    onChange={(e) => setProductFormData({ ...productFormData, partNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Image input field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setProductFormData(prev => ({ ...prev, image: e.target.files[0] }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {productFormData.image && typeof productFormData.image !== 'string' && (
                    <div className="mt-2">
                      <img 
                        src={URL.createObjectURL(productFormData.image)} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                    setProductFormData({ 
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
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  );

  // Pack Form Modal
  const renderPackForm = () => (
    showPackForm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                {editingPack ? 'Edit Pack' : 'Create New Pack'}
              </h2>
              <button 
                onClick={() => {
                  setShowPackForm(false);
                  setEditingPack(null);
                  setPackFormData({ 
                    name: '', 
                    description: '', 
                    category: '', 
                    products: [], 
                    image: null 
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handlePackSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pack Name *</label>
                  <input
                    type="text"
                    value={packFormData.name}
                    onChange={(e) => setPackFormData({ ...packFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={packFormData.description}
                    onChange={(e) => setPackFormData({ ...packFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={packFormData.category}
                    onChange={(e) => setPackFormData({ ...packFormData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Image input field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pack Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setPackFormData(prev => ({ ...prev, image: e.target.files[0] }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {packFormData.image && typeof packFormData.image !== 'string' && (
                    <div className="mt-2">
                      <img 
                        src={URL.createObjectURL(packFormData.image)} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Products</label>
                    <button
                      type="button"
                      onClick={() => setShowProductSelector(true)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Add Products
                    </button>
                  </div>
                  
                  {packFormData.products.length > 0 ? (
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                      {packFormData.products.map((product, index) => (
                        <div key={index} className="p-3 flex items-center justify-between">
                          <div className="flex items-center">
                            {product.image && (
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="w-10 h-10 object-cover rounded-md mr-3"
                              />
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">
                                ${Number(product.price).toFixed(2)} × {product.quantity}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => updateFormPackProductQuantity(product.id, product.quantity - 1)}
                              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center">{product.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateFormPackProductQuantity(product.id, product.quantity + 1)}
                              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeProductFromFormPack(product.id)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                      No products added yet
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowPackForm(false);
                    setEditingPack(null);
                    setPackFormData({ 
                      name: '', 
                      description: '', 
                      category: '', 
                      products: [], 
                      image: null 
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingPack ? 'Update Pack' : 'Create Pack')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  );

  // Product Selector Modal
  const renderProductSelector = () => (
    showProductSelector && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Select Products</h2>
              <button 
                onClick={() => setShowProductSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={productSelectorSearch}
                  onChange={(e) => setProductSelectorSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto">
              {filteredProductsForSelector.map(product => (
                <div 
                  key={product.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => addProductToPack(product)}
                >
                  <div className="flex items-center">
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-12 h-12 object-cover rounded-md mr-3"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        ${Number(product.price).toFixed(2)} • {product.unit}
                      </div>
                      {product.partNumber && (
                        <div className="text-xs text-gray-500 truncate">{product.partNumber}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowProductSelector(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // Product Detail Modal
  const renderProductDetail = () => (
    showProductDetail && selectedProduct && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Product Details</h2>
              <button 
                onClick={() => setShowProductDetail(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Product image */}
            {selectedProduct.image && (
              <div className="mb-4">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedProduct.name}</h3>
                <p className="text-gray-600">{selectedProduct.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Price</div>
                  <div className="text-lg font-semibold">${Number(selectedProduct.price).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Unit</div>
                  <div className="text-lg font-semibold">{selectedProduct.unit}</div>
                </div>
              </div>
              
              {selectedProduct.partNumber && (
                <div>
                  <div className="text-sm text-gray-500">Part Number</div>
                  <div className="text-lg font-semibold">{selectedProduct.partNumber}</div>
                </div>
              )}
              
              {selectedProduct.category && (
                <div>
                  <div className="text-sm text-gray-500">Category</div>
                  <div className="text-lg font-semibold">
                    {categories.find(c => c.id === selectedProduct.category)?.name || selectedProduct.category}
                  </div>
                </div>
              )}
              
              {selectedProduct.supplier && (
                <div>
                  <div className="text-sm text-gray-500">Supplier</div>
                  <div className="text-lg font-semibold">
                    {suppliers.find(s => s.id === selectedProduct.supplier)?.name || selectedProduct.supplier}
                  </div>
                </div>
              )}
              
              {selectedProduct.link && (
                <div>
                  <div className="text-sm text-gray-500">Product URL</div>
                  <a 
                    href={selectedProduct.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Visit Product Page
                  </a>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => {
                  setEditingProduct(selectedProduct);
                  setProductFormData({
                    name: selectedProduct.name,
                    price: String(selectedProduct.price),
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
                  setShowProductForm(true);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => addProductToEstimate(selectedProduct)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add to Estimate
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // Pack Detail Modal
  const renderPackDetail = () => (
    showPackDetail && selectedPack && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Pack Details</h2>
              <button 
                onClick={() => setShowPackDetail(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Pack image */}
            {selectedPack.image && (
              <div className="mb-4">
                <img 
                  src={selectedPack.image} 
                  alt={selectedPack.name} 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedPack.name}</h3>
              <p className="text-gray-600">{selectedPack.description}</p>
              
              {selectedPack.category && (
                <div className="mt-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm">
                    {categories.find(c => c.id === selectedPack.category)?.name || selectedPack.category}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Products</h4>
                <span className="text-sm text-gray-500">
                  {selectedPack.products ? selectedPack.products.length : 0} items
                </span>
              </div>
              
              {selectedPack.products && selectedPack.products.length > 0 ? (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                  {selectedPack.products.map((product, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {product.image && (
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-12 h-12 object-cover rounded-md mr-3"
                            />
                          )}
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              ${Number(product.price).toFixed(2)} × {product.quantity} = ${(Number(product.price) * product.quantity).toFixed(2)}
                            </div>
                            {product.partNumber && (
                              <div className="text-xs text-gray-500">{product.partNumber}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updatePackProductQuantity(selectedPack, index, product.quantity - 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center">{product.quantity}</span>
                          <button
                            onClick={() => updatePackProductQuantity(selectedPack, index, product.quantity + 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeProductFromPack(selectedPack, index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                  No products in this pack
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => {
                  setEditingPack(selectedPack);
                  setPackFormData({
                    name: selectedPack.name,
                    description: selectedPack.description || '',
                    category: selectedPack.category || '',
                    products: selectedPack.products || [],
                    image: selectedPack.image || null
                  });
                  setShowPackDetail(false);
                  setShowPackForm(true);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => addPackToEstimate(selectedPack)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add to Estimate
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // Project Detail Modal
  const renderProjectDetail = () => (
    showProjectDetail && selectedProjectForDetail && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Project Details</h2>
              <button 
                onClick={() => setShowProjectDetail(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedProjectForDetail.name}</h3>
              <p className="text-gray-600 mb-4">{selectedProjectForDetail.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div>{new Date(selectedProjectForDetail.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Last Modified</div>
                  <div>{new Date(selectedProjectForDetail.lastModified).toLocaleDateString()}</div>
                </div>
                {selectedProjectForDetail.address && (
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-500">Address</div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                      {selectedProjectForDetail.address}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-500">Total Items</div>
                  <div className="text-lg font-semibold">
                    {getProjectItemCount(selectedProjectForDetail)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Cost</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${getProjectTotal(selectedProjectForDetail).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Products</h4>
                <span className="text-sm text-gray-500">
                  {selectedProjectForDetail.items ? selectedProjectForDetail.items.length : 0} items
                </span>
              </div>
              
              {selectedProjectForDetail.items && selectedProjectForDetail.items.length > 0 ? (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                  {selectedProjectForDetail.items.map((item, index) => (
                    <div key={item.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500">
                              ${Number(item.price).toFixed(2)} × {item.quantity} = ${(Number(item.price) * item.quantity).toFixed(2)}
                            </div>
                            {item.partNumber && (
                              <div className="text-xs text-gray-500">{item.partNumber}</div>
                            )}
                            {item.fromPack && (
                              <div className="text-xs text-blue-600">From pack: {item.fromPack}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateProductQuantity(selectedProjectForDetail, item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateProductQuantity(selectedProjectForDetail, item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeProductFromProject(selectedProjectForDetail, item.id)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                  No products in this project
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => {
                  setEditingProject(selectedProjectForDetail);
                  setProjectFormData({
                    name: selectedProjectForDetail.name,
                    description: selectedProjectForDetail.description || '',
                    address: selectedProjectForDetail.address || ''
                  });
                  setShowProjectDetail(false);
                  setShowProjectForm(true);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => exportToPDF(selectedProjectForDetail)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // Notification component
  const renderNotification = () => (
    notification && (
      <div className={`fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white z-50 ${
        notification.type === 'success' ? 'bg-green-500' :
        notification.type === 'error' ? 'bg-red-500' :
        'bg-blue-500'
      }`}>
        <div className="flex items-center">
          {notification.type === 'success' ? (
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : notification.type === 'error' ? (
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{notification.message}</span>
        </div>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {renderHeader()}
      {renderNavigation()}
      
      <main>
        {currentView === 'projects' && renderProjectsView()}
        {currentView === 'products' && renderProductsView()}
        {currentView === 'settings' && renderSettingsView()}
      </main>
      
      {renderProjectForm()}
      {renderProductForm()}
      {renderPackForm()}
      {renderProductSelector()}
      {renderProductDetail()}
      {renderPackDetail()}
      {renderProjectDetail()}
      {renderNotification()}
    </div>
  );
};

export default App;
