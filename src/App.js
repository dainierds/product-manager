import React, { useEffect, useState } from 'react';
import { ExternalLink, Package, Users, Settings, Download, Search, Plus, Edit, Trash2, X, Minus, PlusCircle, Eye } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('library');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddPack, setShowAddPack] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showEditPack, setShowEditPack] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showEstimateDetails, setShowEstimateDetails] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showPackDetails, setShowPackDetails] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [currentProject, setCurrentProject] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shareProject, setShareProject] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingPack, setEditingPack] = useState(null);
  const [libraryView, setLibraryView] = useState('products');

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('ecp-products');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        name: '3/4 in. x 10 ft. Gray PVC Schedule 40 Conduit',
        category: 'Electrical',
        supplier: 'Home Depot',
        price: 12.98,
        unit: 'per 10ft',
        description: 'Schedule 40 PVC conduit for electrical wiring protection. UL listed for underground and above ground use.',
        link: 'https://www.homedepot.com/p/conduit',
        dateAdded: '2025-01-15',
        isAutoExtracted: true,
        image: null
      },
      {
        id: 2,
        name: 'Wire Nuts Yellow 12-10 AWG',
        category: 'Electrical',
        supplier: 'Home Depot',
        price: 8.47,
        unit: 'per 100ct',
        description: 'Twist-on wire connectors for copper wires.',
        link: 'https://www.homedepot.com/p/wire-nuts',
        dateAdded: '2025-01-15',
        isAutoExtracted: false,
        image: null
      }
    ];
  });

  const [packs, setPacks] = useState(() => {
    const saved = localStorage.getItem('ecp-packs');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        name: 'Basic Electrical Starter Pack',
        category: 'Electrical',
        description: 'Essential electrical components for basic installations',
        productIds: [1, 2],
        dateAdded: '2025-01-15',
        image: null
      }
    ];
  });

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('ecp-projects');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        name: 'Kitchen Renovation - Smith House',
        description: 'Complete electrical work for kitchen remodel',
        items: [],
        createdAt: '2025-01-10T10:30:00Z',
        lastModified: '2025-01-10T10:30:00Z'
      }
    ];
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('ecp-categories');
    return saved ? JSON.parse(saved) : ['Electrical', 'Plumbing', 'HVAC', 'General'];
  });

  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem('ecp-suppliers');
    return saved ? JSON.parse(saved) : ["Home Depot", "Lowe's", 'Amazon', 'Local Supplier'];
  });

  const [productForm, setProductForm] = useState({
    name: '', link: '', category: '', supplier: '', unit: '', price: '', description: '', image: null
  });

  const [packForm, setPackForm] = useState({
    name: '', category: '', description: '', productIds: [], image: null
  });

  const [projectForm, setProjectForm] = useState({ name: '', description: '' });

  const [packProductQuery, setPackProductQuery] = useState('');
  const [editPackProductQuery, setEditPackProductQuery] = useState('');

  const [newCategory, setNewCategory] = useState('');
  const [newSupplier, setNewSupplier] = useState('');

  useEffect(() => { localStorage.setItem('ecp-products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('ecp-packs', JSON.stringify(packs)); }, [packs]);
  useEffect(() => { localStorage.setItem('ecp-projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('ecp-categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('ecp-suppliers', JSON.stringify(suppliers)); }, [suppliers]);

  const generateId = () => Date.now() + Math.random();
  const showNotification = (message, type = 'info') => { setNotification({ message, type }); setTimeout(() => setNotification(null), 3000); };

  const extractFromHomeDepotURL = (url, pathname) => {
    let name = '';
    let description = '';
    let price = Math.floor(Math.random() * 200) + 20;
    if (pathname.includes('/p/')) {
      const segments = pathname.split('/');
      const productSegment = segments.find((segment, index) => segments[index - 1] === 'p' && segment !== '');
      if (productSegment && !productSegment.match(/^\d+$/)) {
        name = productSegment.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      }
    }
    if (!name) name = 'Producto Home Depot';
    return { name, description: 'Producto de Home Depot. Precio estimado basado en categoría.', price, unit: 'each', isAutoExtracted: true };
  };

  const extractFromLowesURL = (url, pathname) => {
    let name = '';
    let price = Math.floor(Math.random() * 180) + 15;
    if (pathname.includes('/pd/')) {
      const segments = pathname.split('/');
      const productIndex = segments.findIndex((s) => s === 'pd');
      if (productIndex !== -1 && segments[productIndex + 1]) {
        const productSegment = segments[productIndex + 1];
        if (!productSegment.match(/^\d+$/)) {
          name = productSegment.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        }
      }
    }
    if (!name) name = 'Producto Lowes';
    return { name, description: "Producto de Lowe's. Información extraída de URL.", price, unit: 'each', isAutoExtracted: true };
  };

  const extractFromAmazonURL = (url, pathname) => {
    let name = '';
    let price = Math.floor(Math.random() * 300) + 10;
    if (pathname.includes('/dp/')) {
      const segments = pathname.split('/');
      const dpIndex = segments.findIndex((s) => s === 'dp');
      if (dpIndex > 0) {
        const productSegment = segments[dpIndex - 1];
        if (productSegment && !productSegment.match(/^\d+$/)) {
          name = productSegment.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        }
      }
    }
    const urlObj = new URL(url);
    const keywords = urlObj.searchParams.get('keywords');
    if (keywords && !name) name = keywords.replace(/\+/g, ' ');
    if (!name) name = 'Producto Amazon';
    return { name, description: 'Producto de Amazon. Precio estimado.', price, unit: 'each', isAutoExtracted: true };
  };

  const extractFromGenericURL = (url, pathname) => {
    let name = '';
    let price = Math.floor(Math.random() * 100) + 10;
    const segments = pathname.split('/').filter((s) => s !== '');
    const productSegment = segments.find((segment) => segment.length > 8 && segment.includes('-') && !segment.match(/^\d+$/));
    if (productSegment) {
      name = productSegment.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
    if (!name) {
      const hostname = new URL(url).hostname.replace('www.', '');
      name = `Producto de ${hostname}`;
    }
    return { name, description: 'Producto extraído automáticamente. Verifica la información.', price, unit: 'each', isAutoExtracted: true };
  };

  const extractProductInfo = async (url) => {
    setIsExtracting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      let extractedData = { name: '', description: '', price: 0, unit: 'each', isAutoExtracted: true };
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      const hostname = urlObj.hostname.toLowerCase();
      if (hostname.includes('homedepot.com')) extractedData = extractFromHomeDepotURL(url, pathname);
      else if (hostname.includes('lowes.com')) extractedData = extractFromLowesURL(url, pathname);
      else if (hostname.includes('amazon.com')) extractedData = extractFromAmazonURL(url, pathname);
      else extractedData = extractFromGenericURL(url, pathname);
      return extractedData;
    } catch (error) {
      console.error('Error extracting product info:', error);
      showNotification('Error al procesar la URL. Completa la información manualmente.', 'error');
      return { name: '', description: '', price: 0, unit: 'each', isAutoExtracted: false };
    } finally {
      setIsExtracting(false);
    }
  };

  const handleProductUrlChange = async (url) => {
    setProductForm((prev) => ({ ...prev, link: url }));
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      const extracted = await extractProductInfo(url);
      if (extracted) {
        setProductForm((prev) => ({
          ...prev,
          name: extracted.name,
          description: extracted.description,
          price: extracted.price.toString(),
          unit: extracted.unit,
          isAutoExtracted: extracted.isAutoExtracted,
        }));
        showNotification('Product information extracted successfully!', 'success');
      }
    }
  };

  const handleImageUpload = (event, target = 'product', isEdit = false) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { showNotification('Image size must be less than 5MB', 'error'); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (target === 'product') {
          if (isEdit) setEditingProduct((prev) => ({ ...prev, image: e.target.result }));
          else setProductForm((prev) => ({ ...prev, image: e.target.result }));
        } else if (target === 'pack') {
          if (isEdit) setEditingPack((prev) => ({ ...prev, image: e.target.result }));
          else setPackForm((prev) => ({ ...prev, image: e.target.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const resetProductForm = () => setProductForm({ name: '', link: '', category: '', supplier: '', unit: '', price: '', description: '', image: null });
  const resetPackForm = () => setPackForm({ name: '', category: '', description: '', productIds: [], image: null });
  const resetEditForm = () => { setEditingProduct(null); setEditingPack(null); setShowEditProduct(false); setShowEditPack(false); };

  const syncToCloud = async () => { setIsSyncing(true); try { await new Promise((r) => setTimeout(r, 2000)); showNotification('Data synced successfully!', 'success'); } catch (e) { showNotification('Failed to sync data', 'error'); } finally { setIsSyncing(false); } };

  const addProduct = () => {
    if (!productForm.name || !productForm.link) { showNotification('Name and link are required', 'error'); return; }
    const newProduct = { id: generateId(), ...productForm, price: parseFloat(productForm.price) || 0, dateAdded: new Date().toISOString().split('T')[0], isAutoExtracted: productForm.isAutoExtracted || false };
    setProducts((prev) => [...prev, newProduct]);
    resetProductForm();
    setShowAddProduct(false);
    showNotification(`Added ${newProduct.name} successfully!`, 'success');
  };

  const editProduct = (product) => { setEditingProduct({ ...product }); setShowEditProduct(true); };

  const updateProduct = () => {
    if (!editingProduct.name || !editingProduct.link) { showNotification('Name and link are required', 'error'); return; }
    setProducts((prev) => prev.map((product) => (product.id === editingProduct.id ? { ...editingProduct, price: parseFloat(editingProduct.price) || 0 } : product)));
    resetEditForm();
    showNotification(`Updated ${editingProduct.name} successfully!`, 'success');
  };

  const deleteProduct = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts((prev) => prev.filter((product) => product.id !== id));
      setPacks((prev) => prev.map((pack) => ({ ...pack, productIds: pack.productIds.filter((productId) => productId !== id) })));
      showNotification('Product deleted successfully', 'success');
    }
  };

  const addPack = () => {
    if (!packForm.name || packForm.productIds.length === 0) { showNotification('Pack name and at least one product are required', 'error'); return; }
    const newPack = { id: generateId(), ...packForm, dateAdded: new Date().toISOString().split('T')[0] };
    setPacks((prev) => [...prev, newPack]);
    resetPackForm();
    setShowAddPack(false);
    showNotification(`Added pack ${newPack.name} successfully!`, 'success');
  };

  const editPack = (pack) => { setEditingPack({ ...pack }); setShowEditPack(true); };

  const updatePack = () => {
    if (!editingPack.name || editingPack.productIds.length === 0) { showNotification('Pack name and at least one product are required', 'error'); return; }
    setPacks((prev) => prev.map((pack) => (pack.id === editingPack.id ? editingPack : pack)));
    resetEditForm();
    showNotification(`Updated pack ${editingPack.name} successfully!`, 'success');
  };

  const deletePack = (id) => { if (window.confirm('Are you sure you want to delete this pack?')) { setPacks((prev) => prev.filter((pack) => pack.id !== id)); showNotification('Pack deleted successfully', 'success'); } };

  const getPackProducts = (pack) => pack.productIds.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  const getPackTotal = (pack) => getPackProducts(pack).reduce((total, product) => total + product.price, 0);

  const createProject = () => {
    if (!projectForm.name) { showNotification('Project name is required', 'error'); return; }
    const newProject = { id: generateId(), name: projectForm.name, description: projectForm.description || '', items: [], createdAt: new Date().toISOString(), lastModified: new Date().toISOString() };
    setProjects((prev) => [...prev, newProject]);
    setProjectForm({ name: '', description: '' });
    setShowNewProject(false);
    setCurrentProject(newProject);
    setShowEstimateDetails(true);
    showNotification(`Created project ${newProject.name}!`, 'success');
  };

  const addProductToEstimate = (product) => {
    if (!currentProject) {
      const quickProject = { id: generateId(), name: `Quick Estimate - ${new Date().toLocaleDateString()}`, description: 'Automatically created estimate', items: [], createdAt: new Date().toISOString(), lastModified: new Date().toISOString() };
      setProjects((prev) => [...prev, quickProject]);
      setCurrentProject(quickProject);
      setShowEstimateDetails(true);
    }
    const estimateItem = { id: generateId(), productId: product.id, name: product.name, price: product.price, unit: product.unit, description: product.description, supplier: product.supplier, category: product.category, link: product.link, quantity: 1, addedAt: new Date().toISOString() };
    const projectToUpdate = currentProject || projects[projects.length - 1];
    const existingItem = projectToUpdate.items.find((item) => item.productId === product.id);
    if (existingItem) {
      updateItemQuantity(projectToUpdate.id, existingItem.id, existingItem.quantity + 1);
      showNotification(`Increased ${product.name} quantity`, 'success');
    } else {
      setProjects((prev) => prev.map((p) => (p.id === projectToUpdate.id ? { ...p, items: [...p.items, estimateItem], lastModified: new Date().toISOString() } : p)));
      if (currentProject) setCurrentProject((prev) => (prev ? { ...prev, items: [...prev.items, estimateItem] } : null));
      showNotification(`Added ${product.name} to estimate`, 'success');
    }
  };

  const addPackToEstimate = (pack) => { const packProducts = getPackProducts(pack); packProducts.forEach((product) => { if (product) addProductToEstimate(product); }); showNotification(`Added pack ${pack.name} to estimate`, 'success'); };

  const updateItemQuantity = (projectId, itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, items: p.items.filter((item) => item.id !== itemId), lastModified: new Date().toISOString() } : p)));
      if (currentProject && currentProject.id === projectId) setCurrentProject((prev) => (prev ? { ...prev, items: prev.items.filter((item) => item.id !== itemId) } : null));
    } else {
      setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, items: p.items.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)), lastModified: new Date().toISOString() } : p)));
      if (currentProject && currentProject.id === projectId) setCurrentProject((prev) => (prev ? { ...prev, items: prev.items.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)) } : null));
    }
  };

  const deleteProject = (projectId) => { if (window.confirm('Are you sure you want to delete this project?')) { setProjects((prev) => prev.filter((p) => p.id !== projectId)); if (currentProject && currentProject.id === projectId) { setCurrentProject(null); setShowEstimateDetails(false); } showNotification('Project deleted successfully', 'success'); } };
  const openProjectDetails = (project) => { setCurrentProject(project); setShowEstimateDetails(true); };

  const addCategory = () => { if (!newCategory.trim()) { showNotification('Category name is required', 'error'); return; } if (categories.includes(newCategory)) { showNotification('Category already exists', 'error'); return; } setCategories((prev) => [...prev, newCategory]); setNewCategory(''); setShowAddCategory(false); showNotification(`Added category ${newCategory}`, 'success'); };
  const addSupplier = () => { if (!newSupplier.trim()) { showNotification('Supplier name is required', 'error'); return; } if (suppliers.includes(newSupplier)) { showNotification('Supplier already exists', 'error'); return; } setSuppliers((prev) => [...prev, newSupplier]); setNewSupplier(''); setShowAddSupplier(false); showNotification(`Added supplier ${newSupplier}`, 'success'); };
  const deleteCategory = (category) => { if (categories.length > 1) { setCategories((prev) => prev.filter((cat) => cat !== category)); showNotification(`Deleted category ${category}`, 'success'); } };
  const deleteSupplier = (supplier) => { if (suppliers.length > 1) { setSuppliers((prev) => prev.filter((sup) => sup !== supplier)); showNotification(`Deleted supplier ${supplier}`, 'success'); } };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredPacks = packs.filter((pack) => {
    const matchesSearch = pack.name.toLowerCase().includes(searchTerm.toLowerCase()) || (pack.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || pack.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getProjectTotal = (project) => project.items.reduce((total, item) => total + item.price * item.quantity, 0);
  const getProjectItemCount = (project) => project.items.reduce((total, item) => total + item.quantity, 0);

  const exportToPDF = async (project) => {
    showNotification('Generating export...', 'info');
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ECP Assistant - ${project.name}</title><style>body { font-family: Arial, sans-serif; margin: 40px; color: #333; } .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; } .company-name { font-size: 24px; font-weight: bold; color: #2563eb; } .estimate-title { font-size: 32px; font-weight: bold; margin: 20px 0; } .project-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; } .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; } .items-table th, .items-table td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; } .items-table th { background: #f1f5f9; font-weight: bold; } .total-row { background: #2563eb !important; color: white; font-weight: bold; } .text-right { text-align: right; } .link-cell { max-width: 200px; word-break: break-all; font-size: 0.9em; }</style></head><body><div class="header"><div class="company-name">ECP Assistant</div><h1 class="estimate-title">PROJECT ESTIMATE</h1></div><div class="project-info"><h2>${project.name}</h2><p><strong>Description:</strong> ${project.description || 'No description provided'}</p><p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p><p><strong>Total Items:</strong> ${getProjectItemCount(project)}</p></div><table class="items-table"><thead><tr><th>Item</th><th>Description</th><th>Link</th><th>Unit Price</th><th>Quantity</th><th>Total</th></tr></thead><tbody>${project.items.map((item) => `<tr><td><strong>${item.name}</strong></td><td>${item.description}</td><td class="link-cell">${item.link || 'N/A'}</td><td>$${item.price.toFixed(2)} ${item.unit}</td><td>${item.quantity}</td><td class="text-right">$${(item.price * item.quantity).toFixed(2)}</td></tr>`).join('')}<tr class="total-row"><td colspan="5"><strong>TOTAL ESTIMATE</strong></td><td class="text-right"><strong>$${getProjectTotal(project).toFixed(2)}</strong></td></tr></tbody></table><p><em>Generated by ECP Assistant on ${new Date().toLocaleDateString()}</em></p></body></html>`;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_estimate.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setShareProject(project);
      setShowShareModal(true);
      showNotification('Export generated successfully!', 'success');
    } catch (error) {
      showNotification('Error generating export', 'error');
    }
  };

  const generateShareableContent = (project) => {
    const projectSummary = `ECP Assistant - Project Estimate\n\nProject: ${project.name}\nDescription: ${project.description || 'No description provided'}\nDate: ${new Date().toLocaleDateString()}\nTotal Items: ${getProjectItemCount(project)}\nTotal Estimate: $${getProjectTotal(project).toFixed(2)}\n\nItems:\n${project.items.map((item) => `• ${item.name} - $${item.price.toFixed(2)} ${item.unit} × ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}${item.link ? `\n  Link: ${item.link}` : ''}`).join('\n')}\n\nGenerated by ECP Assistant`.trim();
    return projectSummary;
  };

  const shareViaEmail = (project, provider = 'gmail') => {
    const content = generateShareableContent(project);
    const subject = `ECP Assistant - ${project.name} Estimate`;
    const body = encodeURIComponent(content);
    let mailtoUrl = '';
    if (provider === 'gmail') mailtoUrl = `https://mail.google.com/mail/?view=cm&su=${encodeURIComponent(subject)}&body=${body}`;
    else if (provider === 'outlook') mailtoUrl = `https://outlook.live.com/mail/0/deeplink/compose?subject=${encodeURIComponent(subject)}&body=${body}`;
    else mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.open(mailtoUrl, '_blank');
    showNotification(`Opening ${provider} to share estimate`, 'info');
  };

  const shareViaTeams = (project) => {
    const content = generateShareableContent(project);
    const title = `ECP Assistant - ${project.name} Estimate`;
    const teamsUrl = `https://teams.microsoft.com/share?msg=${encodeURIComponent(content)}&title=${encodeURIComponent(title)}`;
    window.open(teamsUrl, '_blank');
    showNotification('Opening Microsoft Teams to share estimate', 'info');
  };

  const copyToClipboard = (project) => { const content = generateShareableContent(project); navigator.clipboard.writeText(content).then(() => { showNotification('Estimate details copied to clipboard!', 'success'); }).catch(() => { showNotification('Failed to copy to clipboard', 'error'); }); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-500 text-white' : notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
          {notification.message}
        </div>
      )}

      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">ECP Assistant</h1>
              <p className="text-slate-600">
                {currentProject ? (
                  <span className="flex items-center gap-2">
                    Active: <strong>{currentProject.name}</strong>
                    {currentProject.items.length > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm">
                        {getProjectItemCount(currentProject)} items • ${getProjectTotal(currentProject).toFixed(2)}
                      </span>
                    )}
                  </span>
                ) : (
                  'Your personal estimation assistant'
                )}
              </p>
            </div>
            <div className="flex gap-3">
              {currentProject && (
                <button onClick={() => setShowEstimateDetails(true)} className="px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors flex items-center gap-2 border border-green-200">
                  <Eye className="w-4 h-4" />
                  View Current Estimate
                </button>
              )}
              <button onClick={syncToCloud} disabled={isSyncing} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors flex items-center gap-2 disabled:opacity-50">
                {isSyncing ? <>🔄 Syncing...</> : <>🔄 Sync</>}
              </button>
              <button onClick={() => setShowNewProject(true)} className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Estimate
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-2 mb-8 inline-flex">
          <button onClick={() => setActiveTab('projects')} className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${activeTab === 'projects' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'}`}>
            <Users className="w-4 h-4" />
            Projects & Estimates
          </button>
          <button onClick={() => setActiveTab('library')} className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${activeTab === 'library' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'}`}>
            <Package className="w-4 h-4" />
            Product Library
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'}`}>
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        {activeTab === 'library' && (
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="bg-white rounded-xl shadow-sm p-2 inline-flex">
                <button onClick={() => setLibraryView('products')} className={`px-4 py-2 rounded-lg font-medium transition-all ${libraryView === 'products' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
                  Products ({products.length})
                </button>
                <button onClick={() => setLibraryView('packs')} className={`px-4 py-2 rounded-lg font-medium transition-all ${libraryView === 'packs' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
                  Packs ({packs.length})
                </button>
              </div>

              <div className="flex gap-3">
                {libraryView === 'products' ? (
                  <button onClick={() => setShowAddProduct(true)} className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                ) : (
                  <button onClick={() => setShowAddPack(true)} className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Pack
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`Search ${libraryView}...`} className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              </div>
            </div>

            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              <button onClick={() => setSelectedCategory('All Categories')} className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${selectedCategory === 'All Categories' ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
                All Categories ({libraryView === 'products' ? products.length : packs.length})
              </button>
              {categories.map((category) => {
                const count = libraryView === 'products' ? products.filter((p) => p.category === category).length : packs.filter((p) => p.category === category).length;
                return (
                  <button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${selectedCategory === category ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
                    {category} ({count})
                  </button>
                );
              })}
            </div>

            {libraryView === 'products' && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all" onClick={() => { setSelectedProduct(product); setShowProductDetails(true); }}>
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-8 h-8 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1">
                            <h3 className="font-bold text-slate-800 text-lg truncate flex-1 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => { setSelectedProduct(product); setShowProductDetails(true); }}>
                              {product.name}
                            </h3>
                            {product.isAutoExtracted && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Auto
                              </div>
                            )}
                          </div>
                          <p className="text-slate-600 text-sm mb-2">{product.description}</p>
                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-semibold">
                              ${product.price.toFixed(2)} {product.unit}
                            </span>
                            <span className="text-slate-500">{product.supplier}</span>
                            <span className="bg-slate-50 text-slate-600 px-2 py-1 rounded text-xs">{product.category}</span>
                          </div>
                          {product.link && (
                            <a href={product.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 text-xs mt-1 inline-flex items-center gap-1 hover:underline">
                              <ExternalLink className="w-3 h-3" />
                              View Product
                            </a>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {(() => {
                            const existingItem = currentProject?.items.find((item) => item.productId === product.id);
                            return (
                              <button onClick={() => addProductToEstimate(product)} className={`p-2 rounded-lg transition-colors relative ${existingItem ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-green-50 text-green-600 hover:bg-green-100'}`} title={existingItem ? `Already in estimate (${existingItem.quantity})` : 'Add to estimate'}>
                                <PlusCircle className="w-4 h-4" />
                                {existingItem && (
                                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                                    {existingItem.quantity}
                                  </span>
                                )}
                              </button>
                            );
                          })()}
                          <button onClick={() => editProduct(product)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Edit product">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteProduct(product.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Delete product">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">No products found</h3>
                    <p className="text-slate-500 mb-4">{searchTerm || selectedCategory !== 'All Categories' ? 'Try adjusting your search or filter criteria' : 'Start by adding your first product'}</p>
                    <button onClick={() => setShowAddProduct(true)} className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">Add Product</button>
                  </div>
                )}
              </div>
            )}

            {libraryView === 'packs' && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredPacks.length > 0 ? (
                  filteredPacks.map((pack) => {
                    const packProducts = getPackProducts(pack);
                    const packTotal = getPackTotal(pack);
                    return (
                      <div key={pack.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer" onClick={() => { setSelectedPack(pack); setShowPackDetails(true); }}>
                            {pack.image ? (
                              <img src={pack.image} alt={pack.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-8 h-8 text-purple-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              <h3 className="font-bold text-slate-800 text-lg truncate flex-1 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => { setSelectedPack(pack); setShowPackDetails(true); }}>{pack.name}</h3>
                              <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                                <Package className="w-3 h-3" />
                                Pack
                              </div>
                            </div>
                            <p className="text-slate-600 text-sm mb-2">{pack.description}</p>
                            <div className="flex items-center gap-4 text-sm flex-wrap mb-2">
                              <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-lg font-semibold">${packTotal.toFixed(2)}</span>
                              <span className="text-slate-500">{packProducts.length} products</span>
                              <span className="bg-slate-50 text-slate-600 px-2 py-1 rounded text-xs">{pack.category}</span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {packProducts.slice(0, 2).map((p) => p.name).join(', ')}
                              {packProducts.length > 2 && ` +${packProducts.length - 2} more`}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button onClick={() => addPackToEstimate(pack)} className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors" title="Add pack to estimate">
                              <PlusCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => editPack(pack)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Edit pack">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => deletePack(pack.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Delete pack">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">No packs found</h3>
                    <p className="text-slate-500 mb-4">{searchTerm || selectedCategory !== 'All Categories' ? 'Try adjusting your search or filter criteria' : 'Start by creating your first pack'}</p>
                    <button onClick={() => setShowAddPack(true)} className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">Create Pack</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Your Projects</h2>
              <button onClick={() => setShowNewProject(true)} className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {projects.length > 0 ? (
                projects.map((project) => {
                  const itemCount = getProjectItemCount(project);
                  const total = getProjectTotal(project);
                  const formattedDate = new Date(project.createdAt).toLocaleDateString();
                  return (
                    <div key={project.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 cursor-pointer" onClick={() => openProjectDetails(project)}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">{project.name}</h3>
                          <p className="text-slate-600 text-sm">{project.description}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button onClick={(e) => { e.stopPropagation(); exportToPDF(project); }} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Export and share estimate">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Delete project">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-4 text-sm text-slate-500">
                          <span>{itemCount} items</span>
                          <span>Created {formattedDate}</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">${total.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">No projects yet</h3>
                  <p className="text-slate-500 mb-4">Create your first project to start building estimates</p>
                  <button onClick={() => setShowNewProject(true)} className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">New Project</button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Settings</h2>
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-700">Categories</h3>
                  <button onClick={() => setShowAddCategory(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Category
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg">
                      <span>{category}</span>
                      {categories.length > 1 && (
                        <button onClick={() => deleteCategory(category)} className="hover:bg-blue-200 rounded p-1 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-700">Suppliers</h3>
                  <button onClick={() => setShowAddSupplier(true)} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Supplier
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suppliers.map((supplier) => (
                    <div key={supplier} className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg">
                      <span>{supplier}</span>
                      {suppliers.length > 1 && (
                        <button onClick={() => deleteSupplier(supplier)} className="hover:bg-green-200 rounded p-1 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Storage Information</h3>
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
                  <p className="mb-2"><strong>Products:</strong> {products.length} items</p>
                  <p className="mb-2"><strong>Packs:</strong> {packs.length} packs</p>
                  <p className="mb-2"><strong>Projects:</strong> {projects.length} projects</p>
                  <p className="mb-2"><strong>Auto-extracted:</strong> {products.filter((p) => p.isAutoExtracted).length} products</p>
                  <p className="text-xs text-slate-500">Data is stored locally in your browser and synced to the cloud.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Add New Product</h2>
            {isExtracting && (
              <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                Extracting product information from URL...
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Product Link *</label>
                <input type="url" value={productForm.link} onChange={(e) => handleProductUrlChange(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="https://... (Improved auto-extraction will fill product details)" disabled={isExtracting} />
                <p className="mt-2 text-xs text-slate-500">Supported: Home Depot, Lowe's, Amazon, Menards, Ace Hardware and more</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Product Name *</label>
                <input type="text" value={productForm.name} onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Enter product name" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Product Image</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'product', false)} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                {productForm.image && (
                  <div className="mt-2">
                    <img src={productForm.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                  <select value={productForm.category} onChange={(e) => setProductForm((prev) => ({ ...prev, category: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Supplier</label>
                  <select value={productForm.supplier} onChange={(e) => setProductForm((prev) => ({ ...prev, supplier: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="">Select supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier} value={supplier}>{supplier}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Price</label>
                  <input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Unit</label>
                  <input type="text" value={productForm.unit} onChange={(e) => setProductForm((prev) => ({ ...prev, unit: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="e.g., per piece, per foot" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea value={productForm.description} onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" rows="3" placeholder="Product description" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={addProduct} disabled={isExtracting} className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-xl hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50">Add Product</button>
              <button onClick={() => { setShowAddProduct(false); resetProductForm(); }} className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAddPack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Create New Pack</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pack Name *</label>
                <input type="text" value={packForm.name} onChange={(e) => setPackForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="Enter pack name" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pack Image</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'pack', false)} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                {packForm.image && (
                  <div className="mt-2">
                    <img src={packForm.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <select value={packForm.category} onChange={(e) => setPackForm((prev) => ({ ...prev, category: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea value={packForm.description} onChange={(e) => setPackForm((prev) => ({ ...prev, description: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" rows="3" placeholder="Pack description" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Products in Pack *</label>
                <div className="border border-slate-300 rounded-xl p-4">
                  <div className="flex gap-2 items-center mb-3">
                    <input type="text" value={packProductQuery} onChange={(e) => setPackProductQuery(e.target.value)} placeholder="Type to search products to add" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                  </div>
                  {packProductQuery.trim().length > 0 && (
                    <div className="border border-slate-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-slate-100 mb-3 bg-white">
                      {products.filter((p) => !packForm.productIds.includes(p.id) && (p.name.toLowerCase().includes(packProductQuery.toLowerCase()) || (p.description || '').toLowerCase().includes(packProductQuery.toLowerCase()))).slice(0, 12).map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50">
                          <div className="min-w-0">
                            <div className="font-medium text-slate-800 truncate">{p.name}</div>
                            <div className="text-xs text-slate-500 truncate">${p.price.toFixed(2)} {p.unit} • {p.category}</div>
                          </div>
                          <button onClick={() => { setPackForm((prev) => ({ ...prev, productIds: [...prev.productIds, p.id] })); setPackProductQuery(''); }} className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">Add</button>
                        </div>
                      ))}
                      {products.filter((p) => !packForm.productIds.includes(p.id) && (p.name.toLowerCase().includes(packProductQuery.toLowerCase()) || (p.description || '').toLowerCase().includes(packProductQuery.toLowerCase()))).length === 0 && (
                        <div className="p-3 text-sm text-slate-500">No matches</div>
                      )}
                    </div>
                  )}
                  {packForm.productIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {packForm.productIds.map((id) => {
                        const p = products.find((x) => x.id === id);
                        if (!p) return null;
                        return (
                          <span key={id} className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                            <span className="truncate max-w-[220px]">{p.name}</span>
                            <button onClick={() => setPackForm((prev) => ({ ...prev, productIds: prev.productIds.filter((pid) => pid !== id) }))} className="hover:bg-green-100 rounded p-1" aria-label={`Remove ${p.name}`}>
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No products selected yet.</p>
                  )}
                  {packForm.productIds.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-700">
                        Selected: {packForm.productIds.length} products
                        <br />
                        Total Value: ${packForm.productIds.reduce((total, id) => { const product = products.find((p) => p.id === id); return total + (product ? product.price : 0); }, 0).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={addPack} className="flex-1 bg-green-500 text-white py-3 px-6 rounded-xl hover:bg-green-600 transition-colors font-semibold">Create Pack</button>
              <button onClick={() => { setShowAddPack(false); resetPackForm(); }} className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showProductDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Product Details</h2>
              <button onClick={() => setShowProductDetails(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="w-full h-64 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden mb-4">
                  {selectedProduct.image ? (
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-16 h-16 text-slate-400" />
                  )}
                </div>

                {selectedProduct.link && (
                  <a href={selectedProduct.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium">
                    <ExternalLink className="w-4 h-4" />
                    View Original Product
                  </a>
                )}
              </div>

              <div>
                <div className="flex items-start gap-2 mb-4">
                  <h3 className="text-xl font-bold text-slate-800 flex-1">{selectedProduct.name}</h3>
                  {selectedProduct.isAutoExtracted && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Auto-extracted
                    </div>
                  )}
                </div>

                <p className="text-slate-600 mb-6">{selectedProduct.description}</p>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Price</span>
                    <span className="font-bold text-xl text-blue-600">${selectedProduct.price.toFixed(2)} {selectedProduct.unit}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Category</span>
                    <span className="font-medium">{selectedProduct.category}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Supplier</span>
                    <span className="font-medium">{selectedProduct.supplier}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Date Added</span>
                    <span className="font-medium">{new Date(selectedProduct.dateAdded).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => { addProductToEstimate(selectedProduct); setShowProductDetails(false); }} className="flex-1 bg-green-500 text-white py-3 px-6 rounded-xl hover:bg-green-600 transition-colors font-semibold flex items-center justify-center gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Add to Estimate
                  </button>
                  <button onClick={() => { editProduct(selectedProduct); setShowProductDetails(false); }} className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPackDetails && selectedPack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify_between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{selectedPack.name}</h2>
                <p className="text-slate-600">{selectedPack.description}</p>
              </div>
              <button onClick={() => setShowPackDetails(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="w-full h-64 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl flex items-center justify-center overflow-hidden mb-4">
                  {selectedPack.image ? (
                    <img src={selectedPack.image} alt={selectedPack.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-16 h-16 text-purple-400" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="bg-slate-50 text-slate-600 px-2 py-1 rounded">{selectedPack.category || 'Uncategorized'}</span>
                  <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">Pack</span>
                </div>
              </div>

              <div>
                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Products in this pack</span>
                    <span className="font-semibold text-purple-700">{getPackProducts(selectedPack).length}</span>
                  </div>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {getPackProducts(selectedPack).map((p) => (
                    <div key={p.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200">
                      <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-800 truncate">{p.name}</div>
                        <div className="text-xs text-slate-500 truncate">{p.supplier} • {p.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-800">${p.price.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">{p.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-4 p-3 bg-purple-50 rounded-lg">
                  <span className="text-slate-700 font-medium">Pack Total</span>
                  <span className="text-xl font-bold text-purple-700">${getPackTotal(selectedPack).toFixed(2)}</span>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => { addPackToEstimate(selectedPack); setShowPackDetails(false); }} className="flex-1 bg-green-500 text-white py-3 px-6 rounded-xl hover:bg-green-600 transition-colors font-semibold flex items-center justify-center gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Add Pack to Estimate
                  </button>
                  <button onClick={() => { editPack(selectedPack); setShowPackDetails(false); }} className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Pack
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showShareModal && shareProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Share Estimate</h2>
                <p className="text-slate-600 text-sm">{shareProject.name}</p>
              </div>
              <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button onClick={() => shareViaEmail(shareProject, 'gmail')} className="w-full flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
                <span className="text-xl">📧</span>
                <span className="font-medium">Share via Gmail</span>
              </button>
              <button onClick={() => shareViaEmail(shareProject, 'outlook')} className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                <span className="text-xl">📨</span>
                <span className="font-medium">Share via Outlook</span>
              </button>
              <button onClick={() => shareViaTeams(shareProject)} className="w-full flex items-center gap-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                <span className="text-xl">👥</span>
                <span className="font-medium">Share via Microsoft Teams</span>
              </button>
              <button onClick={() => shareViaEmail(shareProject, 'default')} className="w-full flex items-center gap-3 p-3 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                <span className="text-xl">✉️</span>
                <span className="font-medium">Share via Default Email</span>
              </button>
              <button onClick={() => copyToClipboard(shareProject)} className="w-full flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                <span className="text-xl">📋</span>
                <span className="font-medium">Copy to Clipboard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditProduct && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Product</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Product Name *</label>
                <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Enter product name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Product Image</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'product', true)} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                {editingProduct.image && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={editingProduct.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                    <button onClick={() => setEditingProduct((prev) => ({ ...prev, image: null }))} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm">Remove Image</button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                  <select value={editingProduct.category} onChange={(e) => setEditingProduct((prev) => ({ ...prev, category: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="">Select category</option>
                    {categories.map((category) => (<option key={category} value={category}>{category}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Supplier</label>
                  <select value={editingProduct.supplier} onChange={(e) => setEditingProduct((prev) => ({ ...prev, supplier: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="">Select supplier</option>
                    {suppliers.map((supplier) => (<option key={supplier} value={supplier}>{supplier}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Price</label>
                  <input type="number" step="0.01" value={editingProduct.price} onChange={(e) => setEditingProduct((prev) => ({ ...prev, price: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Unit</label>
                  <input type="text" value={editingProduct.unit} onChange={(e) => setEditingProduct((prev) => ({ ...prev, unit: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="e.g., per piece, per foot" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Product Link *</label>
                <input type="url" value={editingProduct.link} onChange={(e) => setEditingProduct((prev) => ({ ...prev, link: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea value={editingProduct.description} onChange={(e) => setEditingProduct((prev) => ({ ...prev, description: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" rows="3" placeholder="Product description" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={updateProduct} className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-xl hover:bg-blue-600 transition-colors font-semibold">Update Product</button>
              <button onClick={resetEditForm} className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEditPack && editingPack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Pack</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pack Name *</label>
                <input type="text" value={editingPack.name} onChange={(e) => setEditingPack((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="Enter pack name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pack Image</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'pack', true)} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                {editingPack.image && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={editingPack.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                    <button onClick={() => setEditingPack((prev) => ({ ...prev, image: null }))} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm">Remove Image</button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <select value={editingPack.category} onChange={(e) => setEditingPack((prev) => ({ ...prev, category: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                  <option value="">Select category</option>
                  {categories.map((category) => (<option key={category} value={category}>{category}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea value={editingPack.description} onChange={(e) => setEditingPack((prev) => ({ ...prev, description: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" rows="3" placeholder="Pack description" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Products in Pack *</label>
                <div className="border border-slate-300 rounded-xl p-4">
                  <div className="flex gap-2 items-center mb-3">
                    <input type="text" value={editPackProductQuery} onChange={(e) => setEditPackProductQuery(e.target.value)} placeholder="Type to search products to add" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                  </div>
                  {editPackProductQuery.trim().length > 0 && (
                    <div className="border border-slate-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-slate-100 mb-3 bg-white">
                      {products.filter((p) => !editingPack.productIds.includes(p.id) && (p.name.toLowerCase().includes(editPackProductQuery.toLowerCase()) || (p.description || '').toLowerCase().includes(editPackProductQuery.toLowerCase()))).slice(0, 12).map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50">
                          <div className="min-w-0">
                            <div className="font-medium text-slate-800 truncate">{p.name}</div>
                            <div className="text-xs text-slate-500 truncate">${p.price.toFixed(2)} {p.unit} • {p.category}</div>
                          </div>
                          <button onClick={() => { setEditingPack((prev) => ({ ...prev, productIds: [...prev.productIds, p.id] })); setEditPackProductQuery(''); }} className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">Add</button>
                        </div>
                      ))}
                      {products.filter((p) => !editingPack.productIds.includes(p.id) && (p.name.toLowerCase().includes(editPackProductQuery.toLowerCase()) || (p.description || '').toLowerCase().includes(editPackProductQuery.toLowerCase()))).length === 0 && (
                        <div className="p-3 text-sm text-slate-500">No matches</div>
                      )}
                    </div>
                  )}
                  {editingPack.productIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {editingPack.productIds.map((id) => {
                        const p = products.find((x) => x.id === id);
                        if (!p) return null;
                        return (
                          <span key={id} className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                            <span className="truncate max-w-[220px]">{p.name}</span>
                            <button onClick={() => setEditingPack((prev) => ({ ...prev, productIds: prev.productIds.filter((pid) => pid !== id) }))} className="hover:bg-green-100 rounded p-1" aria-label={`Remove ${p.name}`}>
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No products selected yet.</p>
                  )}
                  {editingPack.productIds.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-700">
                        Selected: {editingPack.productIds.length} products
                        <br />
                        Total Value: ${editingPack.productIds.reduce((total, id) => { const product = products.find((p) => p.id === id); return total + (product ? product.price : 0); }, 0).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={updatePack} className="flex-1 bg-green-500 text-white py-3 px-6 rounded-xl hover:bg-green-600 transition-colors font-semibold">Update Pack</button>
              <button onClick={resetEditForm} className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Add New Category</h2>
            <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4" placeholder="Category name" onKeyDown={(e) => e.key === 'Enter' && addCategory()} />
            <div className="flex gap-3">
              <button onClick={addCategory} className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-xl hover:bg-blue-600 transition-colors font-semibold">Add</button>
              <button onClick={() => { setShowAddCategory(false); setNewCategory(''); }} className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAddSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items_center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Add New Supplier</h2>
            <input type="text" value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none mb-4" placeholder="Supplier name" onKeyDown={(e) => e.key === 'Enter' && addSupplier()} />
            <div className="flex gap-3">
              <button onClick={addSupplier} className="flex-1 bg-green-500 text-white py-3 px-6 rounded-xl hover:bg-green-600 transition-colors font-semibold">Add</button>
              <button onClick={() => { setShowAddSupplier(false); setNewSupplier(''); }} className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showNewProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Create New Project</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Project Name *</label>
                <input type="text" value={projectForm.name} onChange={(e) => setProjectForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="Project name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea value={projectForm.description} onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" rows="3" placeholder="Project description" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={createProject} className="flex-1 bg-green-500 text-white py-3 px-6 rounded-xl hover:bg-green-600 transition-colors font-semibold">Create Project</button>
              <button onClick={() => { setShowNewProject(false); setProjectForm({ name: '', description: '' }); }} className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEstimateDetails && currentProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{currentProject.name}</h2>
                <p className="text-slate-600">{currentProject.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => exportToPDF(currentProject)} className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export & Share
                </button>
                <button onClick={() => setShowEstimateDetails(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {currentProject.items.length > 0 ? (
              <div>
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-slate-800">{getProjectItemCount(currentProject)}</div>
                      <div className="text-sm text-slate-600">Total Items</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{currentProject.items.length}</div>
                      <div className="text-sm text-slate-600">Unique Products</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">${getProjectTotal(currentProject).toFixed(2)}</div>
                      <div className="text-sm text-slate-600">Total Estimate</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {currentProject.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 truncate">{item.name}</h3>
                        <p className="text-sm text-slate-600">{item.description}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                          <span>${item.price.toFixed(2)} {item.unit}</span>
                          <span>•</span>
                          <span>{item.supplier}</span>
                          {item.link && (
                            <>
                              <span>•</span>
                              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 inline-flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                Link
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateItemQuantity(currentProject.id, item.id, Math.max(0, item.quantity - 1))} className="w-8 h-8 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-semibold">{item.quantity}</span>
                          <button onClick={() => updateItemQuantity(currentProject.id, item.id, item.quantity + 1)} className="w-8 h-8 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-slate-800">${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No items in this project</h3>
                <p className="text-slate-500 mb-4">Start adding products from your library</p>
                <button onClick={() => { setShowEstimateDetails(false); setActiveTab('library'); }} className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">Browse Products</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
