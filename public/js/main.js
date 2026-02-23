let map;
let previousLatLng = null;
let hopHistory = [];
let hopMarkers = {};
let hopLines = [];
let socket;

document.addEventListener("DOMContentLoaded", () => {

  socket = io();

  // Inicializar mapa
  map = L.map("map").setView([20, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  const btn = document.getElementById("btnTraceroute");

  btn.addEventListener("click", () => {
    const target = document.getElementById("host").value.trim();
    if (!target) return;

    resetUI(target);
    socket.emit("startTraceroute", target);
  });

  // ===============================
  // SOCKET EVENTS
  // ===============================

  socket.on("hop", (data) => {

    hopHistory.push(data);

    const latlng = [data.lat, data.lon];

    // Crear marker
    const marker = L.marker(latlng).addTo(map)
      .bindPopup(`
        <b>Hop ${data.hop}</b><br>
        IP: ${data.ip}<br>
        ${data.city || "-"}, ${data.country || "-"}<br>
        ISP: ${data.isp || "-"}<br>
        ASN: ${data.as || "-"}<br>
        Reverse: ${data.reverse || "-"}
      `);

    // Guardar marker por número de hop
    hopMarkers[data.hop] = marker;

    // Línea entre hops
    if (previousLatLng) {
      const line = L.polyline([previousLatLng, latlng], { weight: 2 }).addTo(map);
      hopLines.push(line);
    }

    previousLatLng = latlng;

    updateInfoPanel(data);
    renderHopHistory();
  });

  socket.on("status", (msg) => {
    document.getElementById("statStatus").textContent = msg;
  });

  socket.on("done", () => {
    document.getElementById("statStatus").textContent = "Finalizado";
    document.getElementById("statusDot").classList.remove("active");
  });

});

// =================================================
// FUNCIONES
// =================================================

function resetUI(target) {

  hopHistory = [];
  previousLatLng = null;

  // Limpiar markers
  Object.values(hopMarkers).forEach(marker => {
    map.removeLayer(marker);
  });
  hopMarkers = {};

  // Limpiar líneas
  hopLines.forEach(line => map.removeLayer(line));
  hopLines = [];

  document.getElementById("hopTable").innerHTML = "";

  document.getElementById("infoHop").textContent = "—";
  document.getElementById("infoIp").textContent = "—";
  document.getElementById("infoCity").textContent = "—";
  document.getElementById("infoCountry").textContent = "—";
  document.getElementById("infoCoords").textContent = "—";
  document.getElementById("infoIsp").textContent = "—";
  document.getElementById("infoAs").textContent = "—";
  document.getElementById("infoReverse").textContent = "—";

  document.getElementById("statHops").textContent = "0";
  document.getElementById("statTarget").textContent = target;
  document.getElementById("statStatus").textContent = "Iniciando...";

  document.getElementById("statusDot").classList.add("active");
}

function updateInfoPanel(data) {

  document.getElementById("infoHop").textContent = data.hop;
  document.getElementById("infoIp").textContent = data.ip;
  document.getElementById("infoCity").textContent = data.city || "-";
  document.getElementById("infoCountry").textContent = data.country || "-";
  document.getElementById("infoIsp").textContent = data.isp || "-";
  document.getElementById("infoAs").textContent = data.as || "-";
  document.getElementById("infoReverse").textContent = data.reverse || "-";

  document.getElementById("infoCoords").textContent =
    `${data.lat.toFixed(2)}, ${data.lon.toFixed(2)}`;

  document.getElementById("statHops").textContent = data.hop;
}

function renderHopHistory() {

  const container = document.getElementById("hopTable");
  container.innerHTML = "";

  hopHistory.forEach(hop => {

    const row = document.createElement("div");
    row.className = "info-row";
    row.style.cursor = "pointer";

    row.innerHTML = `
      <span class="info-key">#${hop.hop}</span>
      <span class="info-val">${hop.ip}</span>
    `;

    row.onclick = () => {

      const marker = hopMarkers[hop.hop];

      if (marker) {

        const latLng = marker.getLatLng();

        // Animación profesional
        map.flyTo(latLng, 8, {
          animate: true,
          duration: 1.5
        });

        marker.openPopup();
      }

      openHopModal(hop);
    };

    container.appendChild(row);
  });
}

function openHopModal(hop) {

  const modal = document.getElementById("hopModal");
  const body = document.getElementById("modalBody");

  body.innerHTML = `
    <p><b>Hop:</b> ${hop.hop}</p>
    <p><b>IP:</b> ${hop.ip}</p>
    <p><b>Ciudad:</b> ${hop.city || "-"}</p>
    <p><b>País:</b> ${hop.country || "-"}</p>
    <p><b>ISP:</b> ${hop.isp || "-"}</p>
    <p><b>Organización:</b> ${hop.org || "-"}</p>
    <p><b>ASN:</b> ${hop.as || "-"}</p>
    <p><b>Reverse:</b> ${hop.reverse || "-"}</p>
    <p><b>Lat/Lon:</b> ${hop.lat}, ${hop.lon}</p>
  `;

  modal.style.display = "block";
}


// ===============================
// CERRAR MODALES
// ===============================

// Botón cerrar modal de hop
document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("hopModal").style.display = "none";
});

// Botón cerrar historial
document.getElementById("closeHistoryModal").addEventListener("click", () => {
  document.getElementById("historyModal").style.display = "none";
});

// Cerrar al hacer click fuera
window.addEventListener("click", (event) => {

  const hopModal = document.getElementById("hopModal");
  const historyModal = document.getElementById("historyModal");

  if (event.target === hopModal) {
    hopModal.style.display = "none";
  }

  if (event.target === historyModal) {
    historyModal.style.display = "none";
  }

});

// ===============================
// EXPORTAR PDF PROFESIONAL
// ===============================

document.getElementById("btnExportPDF").onclick = () => {

  if (hopHistory.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let y = 20;

  // ================= HEADER =================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("TRACEROUTE REPORT", 14, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleString()}`, pageWidth - 60, y);

  y += 8;

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);

  y += 10;

  // ================= RESUMEN =================
  doc.setFontSize(11);
  doc.text(`Destino: ${document.getElementById("statTarget").textContent}`, 14, y);
  y += 6;
  doc.text(`Total de saltos: ${hopHistory.length}`, 14, y);
  y += 12;

  // ================= TABLA HEADER =================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  doc.text("Hop", 14, y);
  doc.text("IP", 28, y);
  doc.text("Ubicación", 75, y);
  doc.text("ISP", 130, y);

  y += 4;
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  doc.setFont("helvetica", "normal");

  // ================= CONTENIDO =================
  hopHistory.forEach((hop, index) => {

    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    doc.text(String(hop.hop), 14, y);
    doc.text(hop.ip, 28, y);

    const location = `${hop.city || "-"}, ${hop.country || "-"}`;
    doc.text(doc.splitTextToSize(location, 45), 75, y);

    doc.text(doc.splitTextToSize(hop.isp || "-", 55), 130, y);

    y += 10;
  });

  // ================= FOOTER =================
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  doc.save("Traceroute_Report.pdf");
};