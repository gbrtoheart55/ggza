let usuarios = JSON.parse(localStorage.getItem("usuarios")) || {
  admin: { password: "admin123", tipo: "admin" }
};
let contenido = localStorage.getItem("contenido") || "";
let inventario = JSON.parse(localStorage.getItem("inventario")) || [];
let ventas = JSON.parse(localStorage.getItem("ventas")) || [];

function guardarDatos() {
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
  localStorage.setItem("contenido", contenido);
  localStorage.setItem("inventario", JSON.stringify(inventario));
  localStorage.setItem("ventas", JSON.stringify(ventas));
}

function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;
  const errorMsg = document.getElementById("login-error");

  if (usuarios[user] && usuarios[user].password === pass) {
    errorMsg.innerText = "";
    document.getElementById("login-container").classList.add("hidden");

    if (usuarios[user].tipo === "admin") {
      document.getElementById("admin-panel").classList.remove("hidden");
      document.getElementById("admin-welcome").innerText = `Bienvenido, ${user}`;
      mostrarCatalogo();
      actualizarSelectVentas();
      mostrarTablaProductos();
      mostrarGraficos();
    } else {
      document.getElementById("worker-panel").classList.remove("hidden");
      document.getElementById("contenido-trabajadores").innerText = contenido;
      mostrarCatalogo();
      actualizarSelectVentas();
    }
  } else {
    errorMsg.innerText = "Usuario o contraseña incorrecta";
  }
}

function logout() {
  document.getElementById("admin-panel").classList.add("hidden");
  document.getElementById("worker-panel").classList.add("hidden");
  document.getElementById("login-container").classList.remove("hidden");
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

function crearUsuario() {
  const nuevoUsuario = document.getElementById("new-username").value.trim();
  const nuevaClave = document.getElementById("new-password").value;

  if (!nuevoUsuario || !nuevaClave) {
    alert("Completa todos los campos.");
    return;
  }
  if (usuarios[nuevoUsuario]) {
    alert("Usuario ya existe.");
    return;
  }
  usuarios[nuevoUsuario] = { password: nuevaClave, tipo: "trabajador" };
  guardarDatos();
  alert("Usuario creado correctamente.");
  document.getElementById("new-username").value = "";
  document.getElementById("new-password").value = "";
}

function subirContenido() {
  contenido = document.getElementById("admin-content").value;
  guardarDatos();
  alert("Contenido actualizado.");
}

function obtenerBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

async function agregarProducto() {
  const nombre = document.getElementById("product-name").value.trim();
  const cantidad = parseInt(document.getElementById("product-qty").value);
  const precio = parseFloat(document.getElementById("product-price").value);
  const categoria = document.getElementById("product-category").value.trim();
  const imagenInput = document.getElementById("product-image");

  if (!nombre || isNaN(cantidad) || isNaN(precio) || !categoria) {
    alert("Completa todos los campos.");
    return;
  }

  const existe = inventario.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
  if (existe) {
    alert("El producto ya existe.");
    return;
  }

  let imagenBase64 = "";
  if (imagenInput.files.length > 0) {
    try {
      imagenBase64 = await obtenerBase64(imagenInput.files[0]);
    } catch {
      alert("Error al cargar imagen.");
    }
  }

  inventario.push({ nombre, cantidad, precio, categoria, imagen: imagenBase64 });
  guardarDatos();
  alert("Producto agregado.");
  document.getElementById("product-name").value = "";
  document.getElementById("product-qty").value = "";
  document.getElementById("product-price").value = "";
  document.getElementById("product-category").value = "";
  imagenInput.value = "";
  mostrarCatalogo();
  actualizarSelectVentas();
  mostrarTablaProductos();
}

function mostrarCatalogo(filtro = "") {
  const contenedor = document.getElementById("catalogo-productos");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  const productos = inventario.filter(prod =>
    prod.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    prod.categoria.toLowerCase().includes(filtro.toLowerCase())
  );

  productos.forEach(prod => {
    const div = document.createElement("div");
    div.className = "producto";
    div.innerHTML = `
      ${prod.imagen ? `<img src="${prod.imagen}" alt="${prod.nombre}">` : ""}
      <strong>${prod.nombre}</strong><br>
      Categoría: ${prod.categoria}<br>
      Precio: $${prod.precio.toFixed(2)}<br>
      Disponible: ${prod.cantidad}
    `;
    contenedor.appendChild(div);
  });
}

function buscarProducto() {
  const busqueda = document.getElementById("busqueda").value.trim();
  mostrarCatalogo(busqueda);
}

function actualizarSelectVentas() {
  const select = document.getElementById("venta-producto");
  if (!select) return;
  select.innerHTML = "";
  inventario.forEach(p => {
    const option = document.createElement("option");
    option.value = p.nombre;
    option.textContent = p.nombre;
    select.appendChild(option);
  });
}

function registrarVenta() {
  const producto = document.getElementById("venta-producto").value;
  const cantidadVendida = parseInt(document.getElementById("venta-cantidad").value);

  if (!producto || isNaN(cantidadVendida) || cantidadVendida <= 0) {
    alert("Datos inválidos.");
    return;
  }

  const item = inventario.find(p => p.nombre === producto);
  if (item && item.cantidad >= cantidadVendida) {
    item.cantidad -= cantidadVendida;
    ventas.push({ producto, cantidadVendida });
    guardarDatos();
    alert("Venta registrada.");
    mostrarCatalogo();
    actualizarSelectVentas();
    mostrarGraficos();
    mostrarTablaProductos();
  } else {
    alert("Producto no existe o sin suficiente stock.");
  }
}

function mostrarGraficos() {
  const grafVentas = document.getElementById("grafico-ventas");
  const grafStock = document.getElementById("grafico-stock");
  if (!grafVentas || !grafStock) return;

  const ventaData = {};
  ventas.forEach(v => {
    ventaData[v.producto] = (ventaData[v.producto] || 0) + v.cantidadVendida;
  });

  new Chart(grafVentas.getContext("2d"), {
    type: "bar",
    data: {
      labels: Object.keys(ventaData),
      datasets: [{
        label: "Ventas por producto",
        data: Object.values(ventaData),
        backgroundColor: "rgba(75, 192, 192, 0.6)"
      }]
    }
  });

  new Chart(grafStock.getContext("2d"), {
    type: "bar",
    data: {
      labels: inventario.map(p => p.nombre),
      datasets: [{
        label: "Stock disponible",
        data: inventario.map(p => p.cantidad),
        backgroundColor: "rgba(255, 159, 64, 0.6)"
      }]
    }
  });
}

function eliminarProductosSinStock() {
  const sinStock = inventario.filter(p => p.cantidad === 0);
  if (sinStock.length === 0) {
    alert("No hay productos con stock 0.");
    return;
  }

  if (confirm(`¿Eliminar ${sinStock.length} producto(s) sin stock?`)) {
    inventario = inventario.filter(p => p.cantidad > 0);
    guardarDatos();
    mostrarCatalogo();
    actualizarSelectVentas();
    mostrarGraficos();
    mostrarTablaProductos();
    alert("Productos sin stock eliminados.");
  }
}

function mostrarTablaProductos() {
  const contenedor = document.getElementById("tabla-productos");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  if (inventario.length === 0) {
    contenedor.innerHTML = "<p>No hay productos registrados.</p>";
    return;
  }

  const tabla = document.createElement("table");
  tabla.innerHTML = `
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Categoría</th>
        <th>Precio</th>
        <th>Cantidad</th>
        <th>Acción</th>
      </tr>
    </thead>
    <tbody>
      ${inventario.map((p, i) => `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.categoria}</td>
          <td>$${p.precio.toFixed(2)}</td>
          <td>${p.cantidad}</td>
          <td><button onclick="eliminarProductoIndividual(${i})">🗑 Eliminar</button></td>
        </tr>`).join("")}
    </tbody>
  `;
  contenedor.appendChild(tabla);
}

function eliminarProductoIndividual(indice) {
  const producto = inventario[indice];
  if (confirm(`¿Eliminar "${producto.nombre}"?`)) {
    inventario.splice(indice, 1);
    guardarDatos();
    mostrarCatalogo();
    actualizarSelectVentas();
    mostrarGraficos();
    mostrarTablaProductos();
    alert(`Producto "${producto.nombre}" eliminado.`);
  }
}

window.onload = () => {
  actualizarSelectVentas();
};
