//#region Connect with Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, get, set, remove } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBfzxNY-1WXN5KBGygznEYmdsIn1BGQQZs",
    authDomain: "firstdb-b4cf4.firebaseapp.com",
    databaseURL: "https://firstdb-b4cf4-default-rtdb.firebaseio.com",
    projectId: "firstdb-b4cf4",
    storageBucket: "firstdb-b4cf4.appspot.com",
    messagingSenderId: "338718660602",
    appId: "1:338718660602:web:94db65be76a5ea742b7643",
    measurementId: "G-ZQE22TG7S0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
//#endregion

let products = [];
let editMode = false;
let editId = null;
let changedItems = [];

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});

async function getFromDb(){
    const dbRef = ref(db, 'products');
    try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            return snapshot.val() ? Object.values(snapshot.val()) : [];
        } else {
            console.log("No data available");
        }
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

async function loadProducts() {
    try {
        products = await getFromDb();

        if(products.length>0){
            displayProducts();
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function displayProducts() {
    const container = document.getElementById('productTableContainer');
    container.innerHTML = ''; // Clear any existing table

    const table = document.createElement('table');
    table.className = 'table table-hover table-bordered';
    table.id = 'productTable';

    const thead = document.createElement('thead');
    thead.className = 'thead-dark';
    thead.innerHTML = `
        <tr>
            <th>ID</th>
            <th>الاسم</th>
            <th>الوصف الاساسي</th>
            <th>الوصف في اسطر</th>
            <th>منتجات ذات صلة</th>
            <th>السعر</th>
            <th>الصورة الاساسيه</th>
            <th></th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    products.forEach(product => {
        const row = document.createElement('tr');
        
        // Set the row as a clickable link
        row.style.cursor = 'pointer';
        row.onclick = () => editProduct(product.Id);
          

        row.innerHTML = `
            <td>${product.Id}</td>
            <td>${product.Name}</td>
            <td>${truncateText(product.Description, 50)}</td>
            <td>${product.Description2.map(d => `<span>${d.phrase}</span>`).join(', ')}</td>
            <td>${product.relatedproducts.join(', ')}</td>
            <td>${product.Price}</td>
            <td><img src="${product.ImagePath1}" alt="${product.Name}" width="50"></td>
            <td class="actions">
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.Id}); event.stopPropagation();">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

// Helper function to truncate text to a specified length
function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Firebase doesn't allow storing (undefined) values in the database.
// So this method replace them to NULL.
function replaceUndefinedWithNull(obj) {
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, value === undefined ? null : value])
    );
}

async function updateFile(changedItems) {
    try {
        for (let i = 0; i < changedItems.length; i++) {
            const updatedItem = replaceUndefinedWithNull(changedItems[i]);
            await set(ref(db, 'products/' + updatedItem.Id), updatedItem);
        }
        displayProducts(); // Refresh the UI with the latest data
    } catch (error) {
        console.error("Error updating products:", error);
    }
}

async function addProduct() {
    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const description2Text = document.getElementById('description2').value;
    const description2 = description2Text.split(',').map(text => ({ phrase: text.trim() }));
    const relatedproducts = document.getElementById('relatedproducts').value.split(',').map(Number);
    const price = document.getElementById('price').value;

    const imagepath1 = document.getElementById('imageurl1').value;
    const imagefile1 = document.getElementById('imagepath1').files[0];
    const imagepath2 = document.getElementById('imageurl2').value;
    const imagefile2 = document.getElementById('imagepath2').files[0];
    const imagepath3 = document.getElementById('imageurl3').value;
    const imagefile3 = document.getElementById('imagepath3').files[0];
    const imagepath4 = document.getElementById('imageurl4').value;
    const imagefile4 = document.getElementById('imagepath4').files[0];
    const imagepath5 = document.getElementById('imageurl5').value;
    const imagefile5 = document.getElementById('imagepath5').files[0];

    if (!name || !price || (!imagepath1 && !imagefile1 && !editMode)) {
        alert('Name, Price, and at least one Image Path or File are required');
        return;
    }

    const getImagePath = (url, file) => {
        if (file) {
            return URL.createObjectURL(file);
        } else if (url) {
            return url;
        } else {
            return '';
        }
    };

    if (editMode) {
        const productIndex = products.findIndex(p => p.Id === editId);
        if (productIndex !== -1) {
            const updatedProduct = {
                ...products[productIndex],
                Name: name,
                Description: description,
                Description2: description2.map(desc => ({ phrase: desc.phrase })),
                relatedproducts: relatedproducts,
                Price: Number(price),
                ImagePath1: getImagePath(imagepath1, imagefile1) || products[productIndex].ImagePath1,
                ImagePath2: getImagePath(imagepath2, imagefile2) || products[productIndex].ImagePath2,
                ImagePath3: getImagePath(imagepath3, imagefile3) || products[productIndex].ImagePath3,
                ImagePath4: getImagePath(imagepath4, imagefile4) || products[productIndex].ImagePath4,
                ImagePath5: getImagePath(imagepath5, imagefile5) || products[productIndex].ImagePath5
            };
            products[productIndex] = updatedProduct;
            changedItems.push(updatedProduct);
        }
    } else {
        if (!Array.isArray(products)) {
            products = [];
        }
        const newProduct = {
            Id: products.length ? Math.max(...products.map(p => p.Id)) + 1 : 1,
            Name: name,
            Description: description,
            Description2: description2.map(desc => ({ phrase: desc.phrase })),
            relatedproducts: relatedproducts,
            Price: Number(price),
            ImagePath1: getImagePath(imagepath1, imagefile1),
            ImagePath2: getImagePath(imagepath2, imagefile2) || null,
            ImagePath3: getImagePath(imagepath3, imagefile3) || null,
            ImagePath4: getImagePath(imagepath4, imagefile4) || null,
            ImagePath5: getImagePath(imagepath5, imagefile5) || null,
            ZoneAreas: null,
            Category: null
        };

        products.push(newProduct);
        changedItems.push(newProduct);
    }

    //await updateFile(changedItems);
    displayProducts();
    document.getElementById('productForm').reset();
    editMode = false;
    editId = null;

    // Reset image previews
    document.getElementById('preview1').src = '';
    document.getElementById('preview2').src = '';
    document.getElementById('preview3').src = '';
    document.getElementById('preview4').src = '';
    document.getElementById('preview5').src = '';
}

function editProduct(id) {
    const product = products.find(p => p.Id === id);
    if (!product) {
        alert('Product not found');
        return;
    }

    document.getElementById('name').value = product.Name;
    document.getElementById('description').value = product.Description;
    document.getElementById('description2').value = product.Description2.map(desc => desc.phrase).join(', ');
    document.getElementById('relatedproducts').value = product.relatedproducts.join(', ');
    document.getElementById('price').value = product.Price;

    document.getElementById('preview1').src = product.ImagePath1 || '';
    document.getElementById('preview2').src = product.ImagePath2 || '';
    document.getElementById('preview3').src = product.ImagePath3 || '';
    document.getElementById('preview4').src = product.ImagePath4 || '';
    document.getElementById('preview5').src = product.ImagePath5 || '';

    // Set edit mode and editId to indicate that we're editing this product
    editMode = true;
    editId = id;
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await remove(ref(db, 'products/' + id));
            products = products.filter(product => product.Id !== id);
            displayProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    }
}

// Event listener to update realtime db 
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('saveChangesButton').addEventListener('click', async () => {
        try {
            await updateFile(changedItems);
            changedItems = [];
            alert('Changes saved successfully');
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('Error saving changes');
        }
    });
});

// When using modules, functions and variables are not automatically made global
// so this is to Export and Access Function Globally
window.addProduct = addProduct;
window.updateFile = updateFile;
window.deleteProduct = deleteProduct;
