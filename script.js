
// LOAD SAVED CART
let cart = [];

try {
    cart = JSON.parse(localStorage.getItem("foodiesCart")) || [];
} catch (error) {
    cart = [];
}

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

// CHECKOUT FORM
document.getElementById("checkoutForm").addEventListener("submit", function (event) {
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

    let total = 0;
    let orderDetails = "";

    cart.forEach(function (item) {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        orderDetails += item.name + " x " + item.quantity +
            " = ₹" + itemTotal + "\n";
    });

    const orderMessage = document.getElementById("orderMessage");

    orderMessage.innerHTML = `
        <h3>🎉 Order Placed Successfully!</h3>
        <p>Thank you, ${name}!</p>
        <p><strong>Mobile:</strong> ${phone}</p>
        <p><strong>Delivery Address:</strong> ${address}</p>
        <p><strong>Your Order:</strong></p>
        <pre>${orderDetails}</pre>
        <h3>Total Bill: ₹${total}</h3>
        <p>This is a demo order confirmation.</p>
    `;

    cart = [];
    updateCart();
    this.reset();

    alert("Your demo order has been placed successfully!");
});

// SHOW SAVED CART ON PAGE LOAD
updateCart();
