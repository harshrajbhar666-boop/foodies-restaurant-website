
// BACKEND API URL
const API_URL = "http://127.0.0.1:8000";


// LOAD SAVED CART
let cart = [];

try {
    cart = JSON.parse(localStorage.getItem("foodiesCart")) || [];
} catch (error) {
    cart = [];
}


// ORDERS WILL COME FROM BACKEND
let orders = [];


// ADD TO CART
const addButtons = document.querySelectorAll(".add-to-cart");

addButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const name = button.dataset.name;
        const price = Number(button.dataset.price);

        const existingItem = cart.find(item => item.name === name);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                name: name,
                price: price,
                quantity: 1
            });
        }

        updateCart();
        alert(name + " added to cart!");
    });
});


// UPDATE CART AND SAVE
function updateCart() {
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");

    localStorage.setItem("foodiesCart", JSON.stringify(cart));

    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML = "<p>Your cart is empty.</p>";
    }

    let total = 0;

    cart.forEach(function (item, index) {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        cartItems.innerHTML += `
            <div class="cart-item">
                <span>${item.name} × ${item.quantity} = ₹${itemTotal}</span>
                <button class="remove-item" data-index="${index}">
                    Remove
                </button>
            </div>
        `;
    });

    cartTotal.textContent = total;
}


// REMOVE ITEM
document.getElementById("cartItems").addEventListener("click", function (event) {
    if (event.target.classList.contains("remove-item")) {
        const index = Number(event.target.dataset.index);
        cart.splice(index, 1);
        updateCart();
    }
});


// CLEAR CART
document.getElementById("clearCart").addEventListener("click", function () {
    cart = [];
    updateCart();
});


// CONTACT FORM
document.getElementById("contactForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const phone = document.getElementById("phone").value;

    if (!/^[0-9]{10}$/.test(phone)) {
        alert("Please enter a valid 10 digit mobile number.");
        return;
    }

    alert("Thank you! Your message has been received.");
    this.reset();
});


// DISPLAY ORDERS FROM BACKEND
function displayOrders() {
    const orderHistory = document.getElementById("orderHistory");

    if (!orderHistory) {
        console.error("Order History section not found!");
        return;
    }

    orderHistory.innerHTML = "";

    if (orders.length === 0) {
        orderHistory.textContent = "No orders yet.";
        return;
    }

    orders.forEach(function (order) {
        const orderCard = document.createElement("div");
        orderCard.className = "order-card";

        const heading = document.createElement("h3");
        heading.textContent = "Order #" + order.order_id;

        const date = document.createElement("p");
        date.textContent = "Date: " +
            new Date(order.date).toLocaleString("en-IN");

        const customer = document.createElement("p");
        customer.textContent = "Customer: " + order.customer_name;

        const phone = document.createElement("p");
        phone.textContent = "Phone: " + order.phone;

        const address = document.createElement("p");
        address.textContent = "Address: " + order.address;

        const itemHeading = document.createElement("h4");
        itemHeading.textContent = "Ordered Items:";

        const itemList = document.createElement("ul");

        order.items.forEach(function (item) {
            const listItem = document.createElement("li");

            listItem.textContent =
                item.name + " × " + item.quantity +
                " = ₹" + (item.price * item.quantity);

            itemList.appendChild(listItem);
        });

        const total = document.createElement("h3");
        total.textContent = "Total: ₹" + order.total;

        const status = document.createElement("p");
        status.textContent = "Status: " + order.status;

        orderCard.appendChild(heading);
        orderCard.appendChild(date);
        orderCard.appendChild(customer);
        orderCard.appendChild(phone);
        orderCard.appendChild(address);
        orderCard.appendChild(itemHeading);
        orderCard.appendChild(itemList);
        orderCard.appendChild(total);
        orderCard.appendChild(status);

        orderHistory.appendChild(orderCard);
    });
}


// FETCH ORDERS FROM SQLITE THROUGH FASTAPI
async function loadOrders() {
    const orderHistory = document.getElementById("orderHistory");

    try {
        const response = await fetch(API_URL + "/orders");

        if (!response.ok) {
            throw new Error("Could not fetch orders.");
        }

        const data = await response.json();

        orders = data.orders || [];

        displayOrders();

    } catch (error) {
        console.error("Order loading error:", error);

        if (orderHistory) {
            orderHistory.textContent =
                "Unable to load orders. Please check whether backend server is running.";
        }
    }
}


// SHOW ORDER CONFIRMATION
function showOrderConfirmation(order) {
    const orderMessage = document.getElementById("orderMessage");

    orderMessage.innerHTML = "";

    const heading = document.createElement("h3");
    heading.textContent = "🎉 Order Placed Successfully!";

    const customer = document.createElement("p");
    customer.textContent = "Thank you, " + order.customer_name + "!";

    const mobile = document.createElement("p");
    mobile.textContent = "Mobile: " + order.phone;

    const address = document.createElement("p");
    address.textContent = "Delivery Address: " + order.address;

    const itemHeading = document.createElement("p");
    itemHeading.textContent = "Your Order:";

    const itemList = document.createElement("ul");

    order.items.forEach(function (item) {
        const li = document.createElement("li");

        li.textContent =
            item.name + " × " + item.quantity +
            " = ₹" + (item.price * item.quantity);

        itemList.appendChild(li);
    });

    const total = document.createElement("h3");
    total.textContent = "Total Bill: ₹" + order.total;

    const orderId = document.createElement("p");
    orderId.textContent = "Order ID: " + order.order_id;

    const status = document.createElement("p");
    status.textContent = "Status: " + order.status;

    orderMessage.append(
        heading,
        customer,
        mobile,
        address,
        itemHeading,
        itemList,
        total,
        orderId,
        status
    );
}


// CHECKOUT FORM - SEND ORDER TO BACKEND
document.getElementById("checkoutForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    if (cart.length === 0) {
        alert("Your cart is empty! Please add food first.");
        return;
    }

    const name = document.getElementById("checkoutName").value.trim();
    const phone = document.getElementById("checkoutPhone").value.trim();
    const address = document.getElementById("checkoutAddress").value.trim();

    if (!name || !address || !/^[0-9]{10}$/.test(phone)) {
        alert("Please enter valid customer details.");
        return;
    }

    const orderData = {
        name: name,
        phone: phone,
        address: address,
        items: cart.map(function (item) {
            return {
                name: item.name,
                price: Number(item.price),
                quantity: Number(item.quantity)
            };
        })
    };

    const submitButton = this.querySelector('[type="submit"]');

    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        const response = await fetch(API_URL + "/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || "Order could not be placed.");
        }

        const newOrder = result.order;

        // SHOW CONFIRMATION
        showOrderConfirmation(newOrder);

        // CLEAR CART ONLY AFTER SUCCESS
        cart = [];
        updateCart();

        // RESET CHECKOUT FORM
        this.reset();

        // REFRESH ORDER HISTORY FROM DATABASE
        await loadOrders();

        alert("Your order has been placed successfully!");

    } catch (error) {
        console.error("Checkout error:", error);

        alert(
            "Unable to place order. Please check your backend server.\n" +
            error.message
        );

    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
});


// INITIAL PAGE LOAD
updateCart();
loadOrders();
