import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCategoryById, createCategory, updateCategory } from "../../api";

export default function CategoryForm() {
  const { id } = useParams(); // nếu có id => sửa
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (id) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategory = async () => {
    const cat = await getCategoryById(id);
    if (cat) {
      setName(cat.name);
      setDescription(cat.description);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Tên danh mục không được để trống!");
      return;
    }

    if (id) {
      await updateCategory(id, { name, description });
      alert("Cập nhật danh mục thành công!");
    } else {
      await createCategory({ name, description });
      alert("Thêm danh mục thành công!");
    }
    navigate("/categories");
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded shadow mt-10">
      <h1 className="text-2xl font-bold mb-4">{id ? "Sửa danh mục" : "Thêm danh mục"}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Tên danh mục</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            rows="4"
          />
        </div>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
        >
          {id ? "Cập nhật" : "Thêm mới"}
        </button>
      </form>
    </div>
  );
}
