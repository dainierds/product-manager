import React, { useState, useEffect } from 'react';
import { Plus, Package, Trash2, Edit3, Cloud, CloudOff, Settings, Tag, Truck, Home } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const App = () => {
  const [currentView, setCurrentView] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  
  // Forms data
  const [productFormData, setProductFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    supplier: ''
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
      setCategories(categoriesData);

      // Load suppliers
      const suppliersSnapshot = await getDocs(collection(db, 'suppliers'));
      const suppliersData = suppliersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading data:', error);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Product functions
  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setProductFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
      setShowForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product to database');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      category: product.category || '',
      supplier: product.supplier || ''
    });
    setShowForm(true);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'products', id));
        await loadData();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product from database');
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
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Error saving supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupplier = async (id) => {
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

  const cancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setProductFormData({ name: '', price: '', description: '', category: '', supplier: '' });
  };

  // Navigation
  const renderNavigation = () => (
    <div className="bg-white border-b border-gray-200 mb-8">
      <div className="max-w-6xl mx-auto px-4">
        <nav className="flex space-x-8">
          <button
            onClick={() => setCurrentView('products')}
            className={`py-4 px-2 border-b-2 font-medium text-sm ${
              currentView === 'products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Home className="w-4 h-4 inline mr-2" />
            Products
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className={`py-4 px-2 border-b-2 font-medium text-sm ${
              currentView === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Settings
          </button>
        </nav>
      </div>
    </div>
  );

  // Products View
  const renderProductsView = () => (
    <>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Manager</h1>
              <div className="flex items-center space-x-2 mt-1">
                {connected ? (
                  <>
                    <Cloud className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">Connected to Firebase</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">Offline Mode</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-700">Syncing with Firebase...</span>
          </div>
        </div>
      )}

      {/* Add/Edit Product Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={productFormData.name}
                  onChange={handleProductInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={productFormData.price}
                  onChange={handleProductInputChange}
                  disabled={loading}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
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
                  name="category"
                  value={productFormData.category}
                  onChange={handleProductInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
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
                  name="supplier"
                  value={productFormData.supplier}
                  onChange={handleProductInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
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
                name="description"
                value={productFormData.description}
                onChange={handleProductInputChange}
                disabled={loading}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
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
                onClick={cancelForm}
                disabled={loading}
                className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Products ({products.length})
        </h2>
        
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No products added yet</p>
            <p className="text-gray-400">Click "Add Product" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">
                    {product.name}
                  </h3>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      disabled={loading}
                      className="p-1 text-gray-400 hover:text-blue-600 disabled:text-gray-300 transition-colors"
                      title="Edit product"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={loading}
                      className="p-1 text-gray-400 hover:text-red-600 disabled:text-gray-300 transition-colors"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-600">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.category && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                        {product.category}
                      </span>
                    )}
                  </div>
                  
                  {product.supplier && (
                    <p className="text-sm text-gray-500">
                      Supplier: {product.supplier}
                    </p>
                  )}
                  
                  {product.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-400">
                    Added: {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  // Settings View
  const renderSettingsView = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Categories Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Tag className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            </div>
            
            {/* Add Category Form */}
            <div className="space-y-3 mb-6">
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
              <button
                onClick={handleCategorySubmit}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Category
              </button>
            </div>

            {/* Categories List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map(category => (
                <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-gray-500 text-center py-4">No categories added yet</p>
              )}
            </div>
          </div>

          {/* Suppliers Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Truck className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Suppliers</h2>
            </div>
            
            {/* Add Supplier Form */}
            <div className="space-y-3 mb-6">
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
              <button
                onClick={handleSupplierSubmit}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Supplier
              </button>
            </div>

            {/* Suppliers List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {suppliers.map(supplier => (
                <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{supplier.name}</h3>
                    {supplier.contact && (
                      <p className="text-sm text-gray-600">{supplier.contact}</p>
                    )}
                    {supplier.email && (
                      <p className="text-xs text-gray-500">{supplier.email}</p>
                    )}
                    {supplier.phone && (
                      <p className="text-xs text-gray-500">{supplier.phone}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteSupplier(supplier.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {suppliers.length === 0 && (
                <p className="text-gray-500 text-center py-4">No suppliers added yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {renderNavigation()}
        {currentView === 'products' && renderProductsView()}
        {currentView === 'settings' && renderSettingsView()}
      </div>
    </div>
  );
};

export default App;
