import React, { useState, useEffect } from 'react';
import { Plus, Package, Trash2, Edit3, Cloud, CloudOff, Settings, Tag, Truck, Home, FileText, User, Sync, LogOut, Search, X } from 'lucide-react';

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

  // Sample data initialization
  useEffect(() => {
    setTimeout(() => {
      setConnected(true);
      loadSampleData();
    }, 1000);
  }, []);

  const loadSampleData = () => {
    // Sample categories
    setCategories([
      { id: 1, name: 'Electrical', description: 'Electrical components and tools' },
      { id: 2, name: 'Plumbing', description: 'Plumbing supplies and fixtures' },
      { id: 3, name: 'HVAC', description: 'Heating, ventilation, and air conditioning' },
      { id: 4, name: 'General', description: 'General construction materials' }
    ]);

    // Sample suppliers
    setSuppliers([
      { id: 1, name: 'Home Depot', contact: 'John Smith', email: 'john@homedepot.com', phone: '555-0001' },
      { id: 2, name: "Lowe's", contact: 'Jane Doe', email: 'jane@lowes.com', phone: '555-0002' },
      { id: 3, name: 'Amazon', contact: 'Support Team', email: 'support@amazon.com', phone: '555-0003' },
      { id: 4, name: 'Local Supplier', contact: 'Mike Johnson', email: 'mike@local.com', phone: '555-0004' }
    ]);

    // Sample projects
    setProjects([
      { id: 1, name: 'Coastal Clinic', description: '4545 Normandy Blvd', items: 0, total: 0, createdAt: '2025-09-13' },
      { id: 2, name: 'Office Renovation', description: 'Downtown building renovation', items: 0, total: 0, createdAt: '2025-09-14' }
    ]);

    // Sample products
    setProducts([
      { 
        id: 1, 
        name: 'Ryobi One Hp 1...', 
        description: 'Producto de Home Depot. Precio estimado basado en categoría.',
        price: 155.00, 
        category: 'Plumbing', 
        supplier: "Lowe's",
        auto: true,
        createdAt: '2025-09-14'
      }
    ]);

    // Sample packs
    setPacks([]);
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
            <Sync className="w-4 h-4" />
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
              <span>{project.items} items</span>
              <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-green-600">${project.total.toFixed(2)}</span>
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
                  <span className="bg-gray-100 px-2 py-1 rounded">{product.category}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded">
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
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <div key={category.id} className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                <span className="text-sm">{category.name}</span>
                <button className="text-blue-600 hover:text-blue-800">
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
          <div className="flex flex-wrap gap-2">
            {suppliers.map(supplier => (
              <div key={supplier.id} className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                <span className="text-sm">{supplier.name}</span>
                <button className="text-green-600 hover:text-green-800">
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
