document.addEventListener('DOMContentLoaded', () => {
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    const html = document.documentElement;
    
    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    if (currentTheme === 'dark') {
        html.classList.add('dark');
    }
    
    darkModeToggle.addEventListener('click', () => {
        html.classList.toggle('dark');
        
        // Save theme preference
        if (html.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    // Toast notification function
    window.showToast = function(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = document.getElementById('toastIcon');
        
        // Set message
        toastMessage.textContent = message;
        
        // Set icon based on type
        toastIcon.className = type === 'success' 
            ? 'fas fa-check-circle mr-2' 
            : 'fas fa-exclamation-circle mr-2';
        
        // Set background color based on type
        if (type === 'error') {
            toast.classList.add('bg-red-600');
            toast.classList.remove('bg-gray-800');
        } else {
            toast.classList.add('bg-gray-800');
            toast.classList.remove('bg-red-600');
        }
        
        // Show toast
        toast.classList.remove('translate-y-full');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-y-full');
        }, 3000);
    };
});
