import React, { useEffect, useState } from "react";
import { getAllProducts, deleteProduct, updateProduct, createProduct } from "./api";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({
    name: "",
    price: "",
    description: "",
    imageFile: null,
    imagePreview: "",
  });
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    imageFile: null,
    imagePreview: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const data = await getAllProducts();
    setProducts(data);
  };

  // Thêm sản phẩm
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      alert("Tên và giá sản phẩm không được để trống!");
      return;
    }

    const formData = new FormData();
    formData.append("name", newProduct.name);
    formData.append("price", newProduct.price);
    formData.append("description", newProduct.description);
    if (newProduct.imageFile) formData.append("image", newProduct.imageFile);

    try {
      const created = await createProduct(formData);
      if (created) {
        setProducts([...products, created]); // cập nhật state ngay lập tức
        setNewProduct({
          name: "",
          price: "",
          description: "",
          imageFile: null,
          imagePreview: "",
        });
      }
    } catch (error) {
      console.error("Thêm sản phẩm thất bại:", error);
      alert("Thêm sản phẩm thất bại!");
    }
  };

  // Sửa sản phẩm
  const handleEditClick = (product) => {
    setEditingId(product.id);
    setEditingData({
      name: product.name,
      price: product.price,
      description: product.description,
      imageFile: null,
      imagePreview: product.image,
    });
  };

  const handleSave = async () => {
    if (!editingData.name || !editingData.price) {
      alert("Tên và giá sản phẩm không được để trống!");
      return;
    }

    const formData = new FormData();
    formData.append("name", editingData.name);
    formData.append("price", editingData.price);
    formData.append("description", editingData.description);
    if (editingData.imageFile) formData.append("image", editingData.imageFile);

    try {
      const updated = await updateProduct(editingId, formData);
      if (updated) {
        setProducts(products.map((p) => (p.id === editingId ? updated : p)));
      } else {
        setProducts(
          products.map((p) =>
            p.id === editingId ? { ...p, ...editingData, image: editingData.imagePreview } : p
          )
        );
      }
      setEditingId(null);
      setEditingData({
        name: "",
        price: "",
        description: "",
        imageFile: null,
        imagePreview: "",
      });
    } catch (error) {
      console.error("Cập nhật sản phẩm thất bại:", error);
      alert("Cập nhật sản phẩm thất bại!");
    }
  };

  // Xóa sản phẩm
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      try {
        const success = await deleteProduct(id);
        if (success) setProducts(products.filter((p) => p.id !== id));
      } catch (error) {
        console.error("Xóa sản phẩm thất bại:", error);
      }
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Quản lý sản phẩm</h1>

      {/* Form thêm sản phẩm */}
      <div className="card mb-4 p-4 shadow-sm">
        <h5>Thêm sản phẩm mới</h5>
        <div className="row g-3 align-items-center">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Tên sản phẩm"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="Giá"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            />
          </div>
          <div className="col-md-3">
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setNewProduct({
                    ...newProduct,
                    imageFile: file,
                    imagePreview: URL.createObjectURL(file),
                  });
                }
              }}
            />
          </div>
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Mô tả sản phẩm"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
            />
          </div>
          <div className="col-md-1 d-grid">
            <button className="btn btn-success" onClick={handleAddProduct}>
              Thêm
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="row row-cols-1 row-cols-md-3 g-4">
        {products.map((product) => (
          <div key={product.id} className="col">
            <div className="card h-100 shadow-sm">
              {editingId === product.id ? (
                <>
                  <div className="card-body">
                    <input
                      type="text"
                      className="form-control mb-2"
                      value={editingData.name}
                      onChange={(e) =>
                        setEditingData({ ...editingData, name: e.target.value })
                      }
                    />
                    <input
                      type="number"
                      className="form-control mb-2"
                      value={editingData.price}
                      onChange={(e) =>
                        setEditingData({ ...editingData, price: e.target.value })
                      }
                    />
                    <input
                      type="file"
                      className="form-control mb-2"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setEditingData({
                            ...editingData,
                            imageFile: file,
                            imagePreview: URL.createObjectURL(file),
                          });
                        }
                      }}
                    />
                    {editingData.imagePreview && (
                      <img
                        src={editingData.imagePreview}
                        alt=""
                        className="img-fluid mb-2"
                      />
                    )}
                    <input
                      type="text"
                      className="form-control mb-2"
                      placeholder="Mô tả"
                      value={editingData.description}
                      onChange={(e) =>
                        setEditingData({ ...editingData, description: e.target.value })
                      }
                    />
                    <div className="d-flex justify-content-between">
                      <button className="btn btn-success btn-sm" onClick={handleSave}>
                        Lưu
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditingId(null)}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <img
                    src={product.image}
                    className="card-img-top"
                    alt={product.name}
                    style={{ cursor: "pointer" }}
                    onClick={() => alert(product.description || "Chưa có mô tả")}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{product.name}</h5>
                    <p className="card-text text-success">
                      {Number(product.price).toLocaleString()} VNĐ
                    </p>
                    <div className="d-flex justify-content-between">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleEditClick(product)}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
