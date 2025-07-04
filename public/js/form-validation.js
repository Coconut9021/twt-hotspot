document.getElementById('wifiForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Clear previous errors - use multiple approaches
    document.querySelectorAll('.error').forEach(error => {
        error.style.display = 'none';
        error.classList.remove('show');
    });
    
    // Get form data
    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim() || null,
        company: document.getElementById('company').value.trim() || null,
        terms: document.getElementById('terms').checked,
        marketing: document.getElementById('marketing').checked
    };
    
    // Validation with better error display
    let isValid = true;
    
    if (!formData.fullName) {
        document.getElementById('fullNameError').error.style.display = 'block'
        showError('fullNameError', 'Please enter your full name');
        isValid = false;
    }
    
    if (!formData.email || !isValidEmail(formData.email)) {
        showError('emailError', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (formData.phone && !isValidPhone(formData.phone)) {
        showError('phoneError', 'Please enter a valid phone number');
        isValid = false;
    }
    
    if (!formData.terms) {
        showError('termsError', 'You must agree to the Terms of Service');
        isValid = false;
    }
    
    if (isValid) { 
        // Show loading
        document.getElementById('wifiForm').style.display = 'none';
        document.getElementById('loading').style.display = 'block';
        
        // Submit form 
        setTimeout(() => {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/success-simple';
            
            Object.keys(formData).forEach(key => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = formData[key];
                form.appendChild(input);
            });
            
            document.body.appendChild(form);
            form.submit();
        }, 1000);
    }
});

// Helper function to show errors with multiple approaches
function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        // Try multiple approaches to show the error
        errorElement.style.display = 'block';
        errorElement.style.visibility = 'visible';
        errorElement.classList.add('show');
        errorElement.textContent = message;
        
        // Also add visual feedback to the input
        const input = errorElement.previousElementSibling || 
                    errorElement.parentElement.querySelector('input');
        if (input) {
            input.style.borderColor = '#ff4444';
            input.classList.add('error-input');
        }
    }
}

// Clear error styling when user starts typing
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function() {
        this.style.borderColor = '';
        this.classList.remove('error-input');
        
        // Hide related error message
        const errorElement = this.parentElement.querySelector('.error');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.classList.remove('show');
        }
    });
});

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}