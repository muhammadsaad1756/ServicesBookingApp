const API_BASE_URL = "https://localhost:7155/api";

// Show loading spinner
function showLoading() {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
        loadingElement.style.display = "block";
    }
}

// Hide loading spinner
function hideLoading() {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
        loadingElement.style.display = "none";
    }
}

// Check if the JWT token is expired
function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now(); // Convert expiry time to milliseconds
    } catch (error) {
        console.error("Error decoding token:", error);
        return true; // Treat invalid tokens as expired
    }
}

// Fetch and display approved services
async function fetchServices() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/services`);
        if (!response.ok) {
            throw new Error("Failed to fetch services.");
        }
        const services = await response.json();
        if (!services || services.length === 0) {
            throw new Error("No services found.");
        }
        const serviceList = document.getElementById("serviceList");
        if (serviceList) {
            serviceList.innerHTML = services.map(service => `
                <div class="col-md-4 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${service.name}</h5>
                            <p class="card-text">${service.description}</p>
                            <p class="card-text">Price: $${service.price}</p>
                            <a href="booking.html?serviceId=${service.id}" class="btn btn-primary">Book Now</a>
                        </div>
                    </div>
                </div>
            `).join("");
        }
    } catch (error) {
        console.error("Error fetching services:", error);
        alert("Failed to load services. Please try again later.");
    } finally {
        hideLoading();
    }
}

// Handle login
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;

            showLoading();
            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) {
                    throw new Error("Invalid credentials.");
                }

                const data = await response.json();
                localStorage.setItem("token", data.token);
                const decodedToken = JSON.parse(atob(data.token.split('.')[1]));
                localStorage.setItem("userId", decodedToken.nameid); // Make sure this matches your backend claim
                alert("Login successful!");
                window.location.href = "index.html";
            } catch (error) {
                alert(error.message);
            } finally {
                hideLoading();
            }
        });
    }
});





document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("registerName").value;
            const email = document.getElementById("registerEmail").value;
            const password = document.getElementById("registerPassword").value;

            showLoading();
            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password, role: "Customer" })
                });

                if (!response.ok) {
                    throw new Error("Registration failed.");
                }

                alert("Registration successful! Please login.");
                document.getElementById("registerForm").reset();
                window.location.href = "login.html";
            } catch (error) {
                alert(error.message);
            } finally {
                hideLoading();
            }
        });
    }
});

async function fetchServiceName(serviceId) {
    try {
        const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) {
            console.error(`Service fetch failed: ${response.status}`);
            return "Unknown Service"; 
        }

        const service = await response.json(); 
        return service.name || "Unknown Service";
    } catch (error) {
        console.error(`Error fetching service name for ID ${serviceId}:`, error);
        return "Unknown Service"; 
    }
}

async function approveBooking(bookingId) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/approve/${bookingId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Failed to approve booking.");
        }

        alert("Booking approved successfully!");
        fetchPendingData();
    } catch (error) {
        console.error("Error approving booking:", error);
        alert("Failed to approve booking. Please try again.");
    }
}

async function cancelBooking(bookingId) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/cancel/${bookingId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to cancel booking.");
        }

        alert("Booking canceled successfully!");
        fetchPendingData();
    } catch (error) {
        console.error("Error canceling booking:", error);
        alert("Failed to cancel booking. Please try again.");
    }
}


async function fetchPendingData() {
    const token = localStorage.getItem("token");

    if (!token || isTokenExpired(token)) {
        alert("Session expired. Please log in again.");
        window.location.href = "login.html";
        return;
    }

    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/pending`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log("Pending bookings response:", data); 

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch pending bookings.");
        }

        const tableBody = document.getElementById("pendingBookingsTableBody");
        if (!tableBody) {
            console.error("Element with ID 'pendingBookingsTableBody' not found.");
            return;
        }

        tableBody.innerHTML = ""; 

        for (const booking of data) {
            const serviceName = await fetchServiceName(booking.serviceId);
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${booking.id}</td>
                <td>${booking.userId}</td>
                <td>${serviceName}</td>
                <td>${booking.bookingDate}</td>
                <td>${booking.status}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="approveBooking(${booking.id})">Approve</button>
                    <button class="btn btn-danger btn-sm" onclick="cancelBooking(${booking.id})">Cancel</button>
                </td>
            `;

            tableBody.appendChild(row);
        }

    } catch (error) {
        console.error("Error fetching pending bookings:", error);
        alert("Error fetching pending bookings. Please try again.");
    } finally {
        hideLoading();
    }
}



async function approveService(serviceId, isApproved) {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
        alert("Please login as admin.");
        window.location.href = "login.html";
        return;
    }

    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(isApproved)
        });

        if (!response.ok) {
            throw new Error("Failed to update service status.");
        }

        alert("Service status updated.");
        fetchPendingData();
    } catch (error) {
        alert(error.message);
    } finally {
        hideLoading();
    }
}

// Approve/Reject a booking (Admin)
async function approveBooking(bookingId, isApproved) {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
        alert("Please login as admin.");
        window.location.href = "login.html";
        return;
    }

    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(isApproved ? "Approved" : "Rejected")
        });

        if (!response.ok) {
            throw new Error("Failed to update booking status.");
        }

        alert("Booking status updated.");
        fetchPendingData();
    } catch (error) {
        alert(error.message);
    } finally {
        hideLoading();
    }
}

document.addEventListener("DOMContentLoaded", function () {
document.getElementById("addServiceForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const serviceData = {
        name: document.getElementById("name").value,
        description: document.getElementById("description").value,
        price: parseFloat(document.getElementById("price").value),
        duration: parseInt(document.getElementById("duration").value),
        isApproved: false 
    };

    const token = localStorage.getItem("jwtToken"); 

    try {
        const response = await fetch("https://yourapi.com/api/services", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(serviceData)
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById("message").innerHTML = `<div class="alert alert-success">Service added successfully!</div>`;
            document.getElementById("addServiceForm").reset();
        } else {
            document.getElementById("message").innerHTML = `<div class="alert alert-danger">Error: ${result.message || "Failed to add service"}</div>`;
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("message").innerHTML = `<div class="alert alert-danger">An error occurred!</div>`;
    }
});
});


// Handle booking a service
document.addEventListener("DOMContentLoaded", async () => {
    const bookingForm = document.getElementById("bookingForm");
    
    if (bookingForm) {
        bookingForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const serviceId = document.getElementById("serviceId").value;
            const bookingDate = document.getElementById("bookingDate").value;
            const token = localStorage.getItem("token");

            console.log("Selected serviceId:", serviceId);  // Debugging
            console.log("Selected bookingDate:", bookingDate);  // Debugging

            if (!token || isTokenExpired(token)) {
                alert("Please login to book a service.");
                window.location.href = "login.html";
                return;
            }

            const userId = localStorage.getItem("userId"); // Ensure this is stored on login
            if (!userId) {
                alert("User ID not found. Please log in again.");
                window.location.href = "login.html";
                return;
            }

            const requestBody = {
                userId: parseInt(userId),  
                serviceId: parseInt(serviceId), 
                bookingDate: new Date(bookingDate).toISOString(), 
                status: "Pending" 
            };
        
            console.log("Request Body:", JSON.stringify(requestBody)); 

            showLoading();
            try {
                const response = await fetch(`${API_BASE_URL}/bookings`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Booking failed.");
                }

                alert("Booking successful!");
                bookingForm.reset();
            } catch (error) {
                alert(error.message);
            } finally {
                hideLoading();
            }
        });
    }
});


async function fetchServicesForBooking() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/services`);
        if (!response.ok) {
            throw new Error("Failed to fetch services.");
        }
        const services = await response.json();
        if (!services || services.length === 0) {
            throw new Error("No services found.");
        }
        const serviceSelect = document.getElementById("serviceId");
        if (serviceSelect) {
            serviceSelect.innerHTML = services.map(service => `
                <option value="${service.id}">${service.name} - $${service.price}</option>
            `).join("");
        }
    } catch (error) {
        console.error("Error fetching services:", error);
        alert("Failed to load services. Please try again later.");
    } finally {
        hideLoading();
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("token");
            window.location.href = "login.html";
        });
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname.split("/").pop();
    if (path === "index.html") {
        fetchServices();
    } else if (path === "admin.html") {
        fetchPendingData();
    } else if (path === "booking.html") {
        fetchServicesForBooking();
    }
});