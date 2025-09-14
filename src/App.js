import React, { useState, useEffect } from 'react';
import { Plus, Package, Trash2, Edit3, Cloud, CloudOff, Settings, Tag, Truck, Home, FileText, User, RefreshCw, LogOut, Search, X } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const App = () => {
  const [currentView, setCurrentView] = useState('projects');
  const [productView, setProductView] = useState('products'); // products or packs
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
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
  
  const [editingProject, setEditingProject] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  
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
    supplier: ''
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
  }, []);

  // Load all data from Firestore
  const loadData = async () => {
    setLoading(true);
    try {
      // Load projects
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);

      // Load products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);

      // Load categories
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (categoriesData.length === 0) {
        // Add default categories
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
        // Reload categories
        const newCategoriesSnapshot = await getDocs(collection(db, 'categories'));
        const newCategoriesData = newCategoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(newCategoriesData);
      } else {
        setCategories(categoriesData);
      }

      // Load suppliers
      const suppliersSnapshot = await getDocs(collection(db, 'suppliers'));
      const suppliersData = suppliersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (suppliersData.length === 0) {
        // Add default suppliers
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
        // Reload suppliers
        const newSuppliersSnapshot = await getDocs(collection(db, 'suppliers'));
        const newSuppliersData = newSuppliersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSuppliers(newSuppliersData);
      } else {
        setSuppliers(suppliersData);
      }

      // Load packs
      const packsSnapshot = await getDocs(collection(db, 'packs'));
      const packsData = packsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPacks(packsData);

    } catch (error) {
      console.error('Error loading data:', error);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Project functions
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    
    if (!projectFormData.name) {
      alert('Please enter project name');
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        ...projectFormData,
        items: 0,
        total: 0,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'projects'), projectData);
      await loadData();
      setProjectFormData({ name: '', description: '', address: '' });
      setShowProjectForm(false);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project');
    } finally {
      setLoading(false);
    }
  };

  // Product functions
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    if (!productFormData.name || !productFormData.price) {
      alert('Please fill in at least the name and price');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        ...productFormData,
        price: parseFloat(productFormData.price),
        auto: false,
        createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }

      await loadData();
      setProductFormData({ name: '', price: '', description: '', category: '', supplier: '' });
      setShowProductForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product to database');
    } finally {
      setLoading(false);
    }
  };
// Pack functions
  const handlePackSubmit = async (e) => {
    e.preventDefault();
    
    if (!packFormData.name) {
      alert('Please enter pack name');
      return;
    }

    setLoading(true);
    try {
      const packData = {
        ...packFormData,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'packs'), packData);
      await loadData();
      setPackFormData({ name: '', description: '', category: '', products: [] });
      setShowPackForm(false);
    } catch (error) {
      console.error('Error saving pack:', error);
      alert('Error saving pack');
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
      } catch (error) {
        console.error('Error deleting pack:', error);
        alert('Error deleting pack');
      } finally {
        setLoading(false);
      }
    }
  };

  // Category functions
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    
    if (!categoryFormData.name) {
      alert('Please enter category name');
      return;
    }

    setLoading(true);
    try {
      const categoryData = {
        ...categoryFormData,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'categories'), categoryData);
      await loadData();
      setCategoryFormData({ name: '', description: '' });
      setShowCategoryForm(false);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'categories', id));
        await loadData();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category');
      } finally {
        setLoading(false);
      }
    }
  };

  // Supplier functions
  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    
    if (!supplierFormData.name) {
      alert('Please enter supplier name');
      return;
    }

    setLoading(true);
    try {
      const supplierData = {
        ...supplierFormData,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'suppliers'), supplierData);
      await loadData();
      setSupplierFormData({ name: '', contact: '', email: '', phone: '' });
      setShowSupplierForm(false);
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Error saving supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupplier = async (id) => {

    // Pack functions
  const handlePackSubmit = async (e) => {
    e.preventDefault();
    
    if (!packFormData.name) {
      alert('Please enter pack name');
      return;
    }

    setLoading(true);
    try {
      const packData = {
        ...packFormData,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'packs'), packData);
      await loadData();
      setPackFormData({ name: '', description: '', category: '', products: [] });
      setShowPackForm(false);
    } catch (error) {
      console.error('Error saving pack:', error);
      alert('Error saving pack');
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
      } catch (error) {
        console.error('Error deleting pack:', error);
        alert('Error deleting pack');
      } finally {
        setLoading(false);
      }
    }
  };
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'suppliers', id));
        await loadData();
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('Error deleting supplier');
      } finally {
        setLoading(false);
      }
    }
  };

  // Header component
  const renderHeader = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">ECP Assistant</h1>
          <p className="text-sm text-gray-600">Welcome, dainierds41@gmail.com</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
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
  );

  // Navigation component
  const renderNavigation = () => (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setCurrentView('projects')}
            className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              currentView === 'projects'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Projects & Estimates</span>
          </button>
          <button
            onClick={() => setCurrentView('products')}
            className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              currentView === 'products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Library</span>
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              currentView === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </nav>
      </div>
    </div>
  );

  // Projects View
  const renderProjectsView = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
        <button 
          onClick={() => setShowProjectForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Project Form */}
      {showProjectForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingProject ? 'Edit Project' : 'New Project'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                value={projectFormData.name}
                onChange={(e) => setProjectFormData({...projectFormData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={projectFormData.description}
                onChange={(e) => setProjectFormData({...projectFormData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Project description or address"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleProjectSubmit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {loading ? 'Saving...' : 'Save Project'}
              </button>
              <button
                onClick={() => {
                  setShowProjectForm(false);
                  setProjectFormData({ name: '', description: '', address: '' });
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {projects.map(project => (
          <div key={project.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                <p className="text-gray-600">{project.description}</p>
              </div>
              <div className="flex space-x-1">
                <button className="p-1 text-gray-400 hover:text-blue-600">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
              <span>{project.items || 0} items</span>
              <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-green-600">${(project.total || 0).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Product Library View
  const renderProductsView = () => (
    <div className="p-6">
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
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        ) : (
          <button 
            onClick={() => setShowPackForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Pack</span>
          </button>
        )}
      </div>

      {/* Header info */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Library</h2>
        <div className="text-gray-600">
          <p>Connected to Firebase! Your products will sync across devices.</p>
          <p>You have {products.length} products and {packs.length} packs loaded.</p>
        </div>
      </div>

      {/* Product Form */}
      {showProductForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productFormData.name}
                  onChange={(e) => setProductFormData({...productFormData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productFormData.price}
                  onChange={(e) => setProductFormData({...productFormData, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={productFormData.category}
                  onChange={(e) => setProductFormData({...productFormData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <select
                  value={productFormData.supplier}
                  onChange={(e) => setProductFormData({...productFormData, supplier: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows="3"
                value={productFormData.description}
                onChange={(e) => setProductFormData({...productFormData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter product description"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleProductSubmit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
              </button>
              <button
                onClick={() => {
                  setShowProductForm(false);
                  setProductFormData({ name: '', price: '', description: '', category: '', supplier: '' });
                  setEditingProduct(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Pack Form */}
      {showPackForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Create New Pack
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pack Name *
                </label>
                <input
                  type="text"
                  value={packFormData.name}
                  onChange={(e) => setPackFormData({...packFormData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter pack name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={packFormData.category}
                  onChange={(e) => setPackFormData({...packFormData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows="3"
                value={packFormData.description}
                onChange={(e) => setPackFormData({...packFormData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter pack description"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handlePackSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {loading ? 'Saving...' : 'Create Pack'}
              </button>
              <button
                onClick={() => {
                  setShowPackForm(false);
                  setPackFormData({ name: '', description: '', category: '', products: [] });
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${productView}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Categories ({products.length + packs.length})
        </button>
        {categories.map(category => {
          const count = productView === 'products' 
            ? products.filter(p => p.category === category.name).length
            : packs.filter(p => p.category === category.name).length;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedCategory === category.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Content */}
      {productView === 'products' ? renderProductsList() : renderPacksList()}
    </div>
  );

  // Products List
  const renderProductsList = () => {
    const filteredProducts = products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (filteredProducts.length === 0) {
      return (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No products found</p>
          <p className="text-gray-400">Try adjusting your filters or add a new product</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  {product.auto && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Auto</span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="font-bold text-blue-600">${product.price.toFixed(2)} each</span>
                  <span>{product.supplier}</span>
                  {product.category && (
                    <span className="bg-gray-100 px-2 py-1 rounded">{product.category}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => {
                    setEditingProduct(product);
                    setProductFormData({
                      name: product.name,
                      price: product.price.toString(),
                      description: product.description || '',
                      category: product.category || '',
                      supplier: product.supplier || ''
                    });
                    setShowProductForm(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
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
                      } catch (error) {
                        console.error('Error deleting product:', error);
                        alert('Error deleting product');
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button className="text-blue-600 text-sm hover:underline">
                View Product
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Packs List
  const renderPacksList = () => (
    <div className="text-center py-12">
      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 text-lg">No packs found</p>
      <p className="text-gray-400 mb-6">Start by creating your first pack</p>
      <button 
        onClick={() => setShowPackForm(true)}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Create Pack
      </button>
    </div>
  );

  // Settings View
  const renderSettingsView = () => (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
      
      <div className="space-y-8">
        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            <button 
              onClick={() => setShowCategoryForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              + Add Category
            </button>
          </div>

          {/* Category Form */}
          {showCategoryForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                  placeholder="Category name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleCategorySubmit}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Add Category
                  </button>
                  <button
                    onClick={() => {
                      setShowCategoryForm(false);
                      setCategoryFormData({ name: '', description: '' });
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <div key={category.id} className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                <span className="text-sm">{category.name}</span>
                <button 
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-blue-600 hover:text-blue-800"
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
            <h2 className="text-lg font-semibold text-gray-900">Suppliers</h2>
            <button 
              onClick={() => setShowSupplierForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              + Add Supplier
            </button>
          </div>
          
          {/* Supplier Form */}
          {showSupplierForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={supplierFormData.name}
                  onChange={(e) => setSupplierFormData({...supplierFormData, name: e.target.value})}
                  placeholder="Supplier name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={supplierFormData.contact}
                  onChange={(e) => setSupplierFormData({...supplierFormData, contact: e.target.value})}
                  placeholder="Contact person"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="email"
                  value={supplierFormData.email}
                  onChange={(e) => setSupplierFormData({...supplierFormData, email: e.target.value})}
                  placeholder="Email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="tel"
                  value={supplierFormData.phone}
                  onChange={(e) => setSupplierFormData({...supplierFormData, phone: e.target.value})}
                  placeholder="Phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSupplierSubmit}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Add Supplier
                  </button>
                  <button
                    onClick={() => {
                      setShowSupplierForm(false);
                      setSupplierFormData({ name: '', contact: '', email: '', phone: '' });
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {suppliers.map(supplier => (
              <div key={supplier.id} className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                <span className="text-sm">{supplier.name}</span>
                <button 
                  onClick={() => handleDeleteSupplier(supplier.id)}
                  className="text-green-600 hover:text-green-800"
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
          <h3 className="font-semibold text-gray-900 mb-3">Storage Information</h3>
          <div className="space-y-2 text-sm text-gray-600">
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
              <span>{products.filter(p => p.auto).length} products</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Data is stored securely in Firebase and synced in real-time.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      {renderNavigation()}
      
      {loading && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 text-sm">Syncing with Firebase...</span>
          </div>
        </div>
      )}

      {currentView === 'projects' && renderProjectsView()}
      {currentView === 'products' && renderProductsView()}
      {currentView === 'settings' && renderSettingsView()}
    </div>
  );
};

export default App;
