// Initialize jsPDF
const { jsPDF } = window.jspdf;

// Constants
const MAX_IMAGES = 10;
const IMAGE_SIZE = 100;
let siteCounter = 1;

// Helper function to create a new site section
function createSiteSection() {
    siteCounter++;
    const template = document.querySelector('.site-section').cloneNode(true);
    template.querySelector('.site-name').value = '';
    
    // Update IDs to be unique for each site
    const beforeGrid = template.querySelector('.image-grid');
    beforeGrid.id = `before-grid-${siteCounter}`;
    beforeGrid.innerHTML = `
        <div class="image-upload-container">
            <input type="file" accept="image/*" capture="environment" class="image-upload">
            <button class="add-image">+ Add</button>
        </div>
    `;
    
    const afterGrid = template.querySelectorAll('.image-grid')[1];
    afterGrid.id = `after-grid-${siteCounter}`;
    afterGrid.innerHTML = `
        <div class="image-upload-container">
            <input type="file" accept="image/*" capture="environment" class="image-upload">
            <button class="add-image">+ Add</button>
        </div>
    `;
    
    return template;
}

// Function to handle image upload
function handleImageUpload(event, gridId) {
    const files = event.target.files;
    const gridElement = document.getElementById(gridId);
    const currentImages = gridElement.querySelectorAll('.image-container').length;

    if (currentImages + files.length > MAX_IMAGES) {
        alert(`You can only upload ${MAX_IMAGES} images per section`);
        return;
    }

    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-container';
                imageContainer.innerHTML = `
                    <img src="${e.target.result}" class="image-preview" alt="Preview">
                    <button class="delete-image">×</button>
                `;
                
                // Add click event to replace image
                const img = imageContainer.querySelector('.image-preview');
                img.addEventListener('click', () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                        const newFile = e.target.files[0];
                        if (newFile) {
                            const newReader = new FileReader();
                            newReader.onload = (e) => {
                                img.src = e.target.result;
                            };
                            newReader.readAsDataURL(newFile);
                        }
                    };
                    input.click();
                });

                // Add delete functionality
                const deleteBtn = imageContainer.querySelector('.delete-image');
                deleteBtn.addEventListener('click', () => {
                    imageContainer.remove();
                });

                gridElement.insertBefore(imageContainer, gridElement.lastElementChild);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Function to generate PDF for all sites
function generateAllPDFs() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const imageWidth = (pageWidth - 3 * margin) / 2;
    const imageHeight = imageWidth * 0.75;

    document.querySelectorAll('.site-section').forEach((siteSection, index) => {
        if (index > 0) {
            doc.addPage();
        }

        const siteName = siteSection.querySelector('.site-name').value || 'Unnamed Site';
        const beforeImages = Array.from(siteSection.querySelectorAll('.image-preview')).filter(img => 
            img.closest('.before-section')
        ).map(img => img.src);
        const afterImages = Array.from(siteSection.querySelectorAll('.image-preview')).filter(img => 
            img.closest('.after-section')
        ).map(img => img.src);

        // Add site name
        doc.setFontSize(20);
        doc.text(siteName, pageWidth / 2, 20, { align: 'center' });

        // Add before images
        doc.setFontSize(16);
        doc.text('Before', margin, 40);
        let y = 50;
        beforeImages.forEach((img, index) => {
            if (y + imageHeight > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
            }
            doc.addImage(img, 'JPEG', margin, y, imageWidth, imageHeight);
            y += imageHeight + margin;
        });

        // Add after images
        y = 50;
        doc.text('After', pageWidth / 2 + margin, 40);
        afterImages.forEach((img, index) => {
            if (y + imageHeight > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
            }
            doc.addImage(img, 'JPEG', pageWidth / 2 + margin, y, imageWidth, imageHeight);
            y += imageHeight + margin;
        });
    });

    doc.save('all_sites_report.pdf');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Add new site
    document.getElementById('add-site').addEventListener('click', () => {
        const newSite = createSiteSection();
        document.getElementById('sites-container').appendChild(newSite);
        setupSiteEventListeners(newSite);
    });

    // Generate PDF for all sites
    document.getElementById('generate-all-pdf').addEventListener('click', generateAllPDFs);

    // Setup initial site
    setupSiteEventListeners(document.querySelector('.site-section'));
});

// Function to setup event listeners for a site section
function setupSiteEventListeners(siteSection) {
    // Delete site
    siteSection.querySelector('.delete-site').addEventListener('click', () => {
        if (document.querySelectorAll('.site-section').length > 1) {
            siteSection.remove();
        } else {
            alert('You must have at least one site section');
        }
    });

    // Before images upload
    const beforeGrid = siteSection.querySelector('.before-section .image-grid');
    const beforeUpload = beforeGrid.querySelector('.image-upload');
    beforeUpload.addEventListener('change', (e) => handleImageUpload(e, beforeGrid.id));

    // After images upload
    const afterGrid = siteSection.querySelector('.after-section .image-grid');
    const afterUpload = afterGrid.querySelector('.image-upload');
    afterUpload.addEventListener('change', (e) => handleImageUpload(e, afterGrid.id));

    // Add image buttons
    siteSection.querySelectorAll('.add-image').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            input.click();
        });
    });
} 