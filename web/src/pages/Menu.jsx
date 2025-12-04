import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react"; // small clean icons
import Loading from "../components/Loading";
import Modal from "../components/Modal";
import { toast } from "sonner"; // notis - need for updates

export default function Menu() {
  const [menu, setMenu] = useState(null);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Drinks",
    price: "",
  });

  // edit modal state
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    category: "",
    price: "",
  });

  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => setMenu(data));
  }, []);

  if (!menu) return <Loading />;

  // add item
  const addItem = () => {
    const item = {
      id: Date.now(),
      ...newItem,
      price: parseFloat(newItem.price),
    };

    setMenu([...menu, item]);
    setNewItem({ name: "", category: "Drinks", price: "" });

    toast.success("Item added"); // 
  };

  // delete
  const deleteItem = (id) => {
    setMenu(menu.filter((item) => item.id !== id));
    toast.error("Item deleted");
  };

  // open edit modal
  const openEditor = (item) => {
    setEditing(item.id);
    setEditData({
      name: item.name,
      category: item.category,
      price: item.price,
    });
  };

  // save edit changes
  const saveEdit = () => {
    setMenu(
      menu.map((item) =>
        item.id === editing ? { ...item, ...editData } : item
      )
    );

    toast.success("Item updated"); //update noti


    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <h1 className="text-2xl font-semibold">Menu</h1>

      {/* ADD ITEM BOX */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
        <h2 className="font-semibold mb-4">Add New Item</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Name"
            className="px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none"
            value={newItem.name}
            onChange={(e) =>
              setNewItem({ ...newItem, name: e.target.value })
            }
          />

          <select
            className="px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg"
            value={newItem.category}
            onChange={(e) =>
              setNewItem({ ...newItem, category: e.target.value })
            }
          >
            <option>Drinks</option>
            <option>Bakery</option>
            <option>Food</option>
          </select>

          <input
            type="number"
            placeholder="Price"
            className="px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none"
            value={newItem.price}
            onChange={(e) =>
              setNewItem({ ...newItem, price: e.target.value })
            }
          />
        </div>

        <button
          className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800"
          onClick={addItem}
        >
          Add Item
        </button>
      </div>

      {/* MENU GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {menu.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md relative"
          >
            {/* Edit + Delete icons */}
            <div className="absolute top-3 right-3 flex gap-2">
              <Pencil
                size={18}
                className="text-blue-600 cursor-pointer hover:scale-110 transition"
                onClick={() => openEditor(item)}
              />
              <Trash2
                size={18}
                className="text-red-600 cursor-pointer hover:scale-110 transition"
                onClick={() => deleteItem(item.id)}
              />
            </div>

            <h3 className="text-lg font-semibold pr-8">{item.name}</h3>
            <p className="opacity-75">{item.category}</p>
            <p className="mt-2 font-medium">${item.price.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      <Modal open={editing !== null} onClose={() => setEditing(null)}>
        <h2 className="text-xl font-semibold mb-4">Edit Item</h2>

        <input
          className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 rounded-lg mb-3"
          value={editData.name}
          onChange={(e) =>
            setEditData({ ...editData, name: e.target.value })
          }
        />

        <select
          className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 rounded-lg mb-3"
          value={editData.category}
          onChange={(e) =>
            setEditData({ ...editData, category: e.target.value })
          }
        >
          <option>Drinks</option>
          <option>Bakery</option>
          <option>Food</option>
        </select>

        <input
          type="number"
          className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 rounded-lg mb-3"
          value={editData.price}
          onChange={(e) =>
            setEditData({ ...editData, price: parseFloat(e.target.value) })
          }
        />

        <button
          onClick={saveEdit}
          className="w-full bg-amber-700 text-white px-4 py-2 rounded-lg"
        >
          Save Changes
        </button>
      </Modal>
    </div>
  );
}
