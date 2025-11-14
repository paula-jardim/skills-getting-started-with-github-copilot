document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Modal de confirmação customizado
  let confirmModal = document.getElementById("confirm-modal");
  if (!confirmModal) {
    confirmModal = document.createElement("div");
    confirmModal.id = "confirm-modal";
    confirmModal.className = "modal hidden";
    confirmModal.innerHTML = `
      <div class="modal-content">
        <p id="confirm-modal-message">Tem certeza que deseja remover este participante?</p>
        <div class="modal-actions">
          <button id="modal-cancel-btn" type="button">Cancelar</button>
          <button id="modal-confirm-btn" type="button">Remover</button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmModal);
  }

  function showConfirmModal(message) {
    document.getElementById("confirm-modal-message").textContent = message || "Tem certeza?";
    confirmModal.classList.remove("hidden");
    return new Promise(resolve => {
      const onCancel = () => {
        confirmModal.classList.add("hidden");
        cleanup();
        resolve(false);
      };
      const onConfirm = () => {
        confirmModal.classList.add("hidden");
        cleanup();
        resolve(true);
      };
      function cleanup() {
        cancelBtn.removeEventListener("click", onCancel);
        confirmBtn.removeEventListener("click", onConfirm);
      }
      const cancelBtn = document.getElementById("modal-cancel-btn");
      const confirmBtn = document.getElementById("modal-confirm-btn");
      cancelBtn.addEventListener("click", onCancel);
      confirmBtn.addEventListener("click", onConfirm);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Limpar opções antigas do select
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';


      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Criar lista de participantes (oculta por padrão)
        const participantsListId = `participants-list-${name.replace(/\s+/g, "-")}`;
        let participantsListHTML = "";
        if (details.participants.length === 0) {
          participantsListHTML = '<li class="no-participants">Nenhum participante ainda.</li>';
        } else {
          participantsListHTML = details.participants.map(email => `
            <li class="participant-item">
              <span class="participant-email">${email}</span>
              <button class="delete-participant-btn" title="Remover participante" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(email)}">🗑️</button>
            </li>
          `).join("");
        }
        const participantsList = `
          <div class="participants-section">
            <button class="toggle-participants-btn" type="button" data-target="${participantsListId}">
              👥 Ver participantes
            </button>
            <ul id="${participantsListId}" class="participants-list hidden">
              ${participantsListHTML}
            </ul>
          </div>
        `;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsList}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Adicionar evento para mostrar/ocultar participantes
      activitiesList.querySelectorAll(".toggle-participants-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const targetId = btn.getAttribute("data-target");
          const list = document.getElementById(targetId);
          list.classList.toggle("hidden");
          btn.textContent = list.classList.contains("hidden") ? "👥 Ver participantes" : "👥 Ocultar participantes";
        });
      });

      // Adicionar evento para deletar participante
      activitiesList.querySelectorAll(".delete-participant-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const activity = btn.getAttribute("data-activity");
          const email = btn.getAttribute("data-email");
          if (!activity || !email) return;
          const confirmed = await showConfirmModal("Tem certeza que deseja remover este participante?");
          if (!confirmed) return;
          try {
            const response = await fetch(`/activities/${activity}/participants/${email}`, {
              method: "DELETE"
            });
            const result = await response.json();
            if (response.ok) {
              messageDiv.textContent = result.message;
              messageDiv.className = "success";
              messageDiv.classList.remove("hidden");
              fetchActivities();
            } else {
              messageDiv.textContent = result.detail || "Erro ao remover participante.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
            }
            setTimeout(() => {
              messageDiv.classList.add("hidden");
            }, 5000);
          } catch (error) {
            messageDiv.textContent = "Erro ao remover participante.";
            messageDiv.className = "error";
            messageDiv.classList.remove("hidden");
            setTimeout(() => {
              messageDiv.classList.add("hidden");
            }, 5000);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Atualiza a lista de atividades após cadastro
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
