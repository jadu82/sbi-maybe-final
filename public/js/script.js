document.addEventListener("DOMContentLoaded", function() {
  const container = document.getElementById("deviceContainer");

  const menuIcon = document.querySelector(".menu-icon");
  const navLinks = document.querySelector(".nav-links");

  if (menuIcon && navLinks) {
    menuIcon.addEventListener("click", function(e) {
      e.stopPropagation();
      navLinks.classList.toggle("active");
      menuIcon.classList.toggle("rotate");
    });
  }

  if (container) {
    container.addEventListener("click", function (event) {
      let target = event.target;
      while (target && !target.classList.contains("device-card")) {
        target = target.parentElement;
      }
      if (target && target.dataset.id) {
        const deviceId = target.dataset.id;
        window.location.href = `/api/device/admin/phone/${deviceId}`;
      }
    });
  }

  document.addEventListener("click", function(e) {
    if (navLinks && !navLinks.contains(e.target) && !menuIcon.contains(e.target)) {
      navLinks.classList.remove("active");
      menuIcon.classList.remove("rotate");
    }
  });

  const socket = io();

  socket.on("connect", () => {
    console.log("Connected to Server");

    // ✅ Emit registerStatus for all visible device cards
    const cards = document.querySelectorAll(".device-card");
    cards.forEach(card => {
      const uniqueid = card.dataset.id;
      if (uniqueid) {
        socket.emit("registerStatus", { uniqueid });
        console.log("Emitted registerStatus for:", uniqueid);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from Server");
  });

  socket.on("batteryUpdate", (batteryStatuses) => {
    batteryStatuses.forEach(battery => {
      updateDeviceCard(battery);
    });
  });

  socket.on("newDevice", (newDevice) => {
    addNewDeviceCard(newDevice);
  });

  // ✅ Real-time listener for server-side status changes
  socket.on("statusUpdate", (data) => {
    const { uniqueid, connectivity } = data;
    const card = document.querySelector(`[data-id="${uniqueid}"]`);
    if (card) {
      const statusEl = card.querySelector(".device-status");
      if (statusEl) {
        if (connectivity === 'Online') {
          statusEl.classList.remove("status-offline");
          statusEl.classList.add("status-online");
          statusEl.innerHTML = "Status - Online User";
        } else {
          statusEl.classList.remove("status-online");
          statusEl.classList.add("status-offline");
          statusEl.innerHTML = "Status - Offline User";
        }
      }
    }
  });

  function updateDeviceCard(battery) {
    const deviceCard = document.querySelector(`[data-id="${battery.uniqueid}"]`);
    
    if (deviceCard) {
      const brandElement = deviceCard.querySelector("h3");
      if (brandElement) {
        brandElement.innerHTML = battery.brand || 'Unknown Brand';
      }

      const uniqueidElement = deviceCard.querySelector("p:nth-child(2)");
      if (uniqueidElement) {
        uniqueidElement.innerHTML = `<strong>Device Id:</strong> ${battery.uniqueid || 'N/A'}`;
      }

      const batteryElement = deviceCard.querySelector(".device-details p:nth-child(3)");
      if (batteryElement) {
        batteryElement.innerHTML = `<strong>Battery:</strong> ${battery.batteryLevel ? battery.batteryLevel + '%' : 'N/A'}`;
      }

      const statusElement = deviceCard.querySelector(".device-status");
      if (statusElement) {
        if (battery.connectivity === 'Online') {
          statusElement.classList.remove("status-offline");
          statusElement.classList.add("status-online");
          statusElement.innerHTML = "Status - Online User";
        } else if (battery.connectivity === 'Offline') {
          statusElement.classList.remove("status-online");
          statusElement.classList.add("status-offline");
          statusElement.innerHTML = "Status - Offline User";
        }
      }
    }
  }

  function addNewDeviceCard(newDevice) {
    const container = document.getElementById("deviceContainer");

    const deviceCard = document.createElement("div");
    deviceCard.classList.add("device-card");
    deviceCard.dataset.id = newDevice.uniqueid;

    deviceCard.innerHTML = `
      <div class="device-content">
        <img src="/image/nothing.webp" alt="Device Icon" />
        <div class="device-details">
          <h2>Mobile : ${newDevice.brand || 'Unknown Brand'}</h2>
          <p><strong>Device Id :</strong> ${newDevice.uniqueid}</p>
          <p><strong>Battery :</strong> ${newDevice.batteryLevel ? newDevice.batteryLevel + '%' : 'N/A'}</p>
        </div>
      </div>
      <div class="device-status ${newDevice.connectivity === 'Online' ? 'status-online' : 'status-offline'}">
        Status - ${newDevice.connectivity === 'Online' ? 'Online User' : 'Offline User'}
      </div>
    `;

    container.appendChild(deviceCard);
  }
});
