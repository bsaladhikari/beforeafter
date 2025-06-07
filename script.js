// Initialize jsPDF
const { jsPDF } = window.jspdf;

// Constants
const MAX_IMAGES = 15;
const IMAGE_SIZE = 100;
let siteCounter = 1;

// Helper function to create a new site section
function createSiteSection() {
    siteCounter++;
    const template = document.querySelector('.site-section').cloneNode(true);
    template.querySelector('.site-name').value = '';
    // Update section headers
    template.querySelector('.before-section h2').textContent = 'Before Images (Max 15)';
    template.querySelector('.after-section h2').textContent = 'After Images (Max 15)';
    
    // Update IDs to be unique for each site
    const beforeGrid = template.querySelector('.image-grid');
    beforeGrid.id = `before-grid-${siteCounter}`;
    beforeGrid.innerHTML = `
        <div class="image-upload-container">
            <input type="file" accept="image/*" class="image-upload" style="display:none">
            <button class="add-image">+ Add</button>
        </div>
    `;
    
    const afterGrid = template.querySelectorAll('.image-grid')[1];
    afterGrid.id = `after-grid-${siteCounter}`;
    afterGrid.innerHTML = `
        <div class="image-upload-container">
            <input type="file" accept="image/*" class="image-upload" style="display:none">
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
                const originalDataUrl = e.target.result;
                const imgEl = new window.Image();
                imgEl.onload = function() {
                    const imageContainer = document.createElement('div');
                    imageContainer.className = 'image-container';
                    imageContainer.innerHTML = `
                        <img src="${originalDataUrl}" class="image-preview" alt="Preview">
                        <button class="delete-image">×</button>
                    `;
                    imageContainer.setAttribute('draggable', 'true');
                    imageContainer.dataset.original = originalDataUrl;

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
                                    imageContainer.dataset.original = e.target.result;
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

                    // Drag and drop events
                    imageContainer.addEventListener('dragstart', (e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', null); // for Firefox
                        imageContainer.classList.add('dragging');
                    });
                    imageContainer.addEventListener('dragend', (e) => {
                        imageContainer.classList.remove('dragging');
                    });

                    gridElement.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        const dragging = gridElement.querySelector('.dragging');
                        const { after, refElement, isFirst, isLast } = getDropPosition(gridElement, e.clientX, e.clientY);
                        if (isFirst && refElement) {
                            gridElement.insertBefore(dragging, refElement);
                        } else if (isLast) {
                            gridElement.insertBefore(dragging, gridElement.lastElementChild);
                        } else if (refElement) {
                            if (after) {
                                if (refElement.nextSibling) {
                                    gridElement.insertBefore(dragging, refElement.nextSibling);
                                } else {
                                    gridElement.appendChild(dragging);
                                }
                            } else {
                                gridElement.insertBefore(dragging, refElement);
                            }
                        } else {
                            gridElement.insertBefore(dragging, gridElement.lastElementChild);
                        }
                    });

                    function getDropPosition(container, x, y) {
                        const draggableElements = [...container.querySelectorAll('.image-container:not(.dragging)')];
                        if (draggableElements.length === 0) {
                            return { after: false, refElement: null, isFirst: false, isLast: true };
                        }
                        // Check if cursor is before the first image
                        const firstBox = draggableElements[0].getBoundingClientRect();
                        if (x < firstBox.left + firstBox.width / 2 && y < firstBox.bottom + firstBox.height) {
                            return { after: false, refElement: draggableElements[0], isFirst: true, isLast: false };
                        }
                        // Check if cursor is after the last image
                        const lastBox = draggableElements[draggableElements.length - 1].getBoundingClientRect();
                        if (x > lastBox.right - lastBox.width / 2 && y > lastBox.top - lastBox.height) {
                            return { after: false, refElement: null, isFirst: false, isLast: true };
                        }
                        // Otherwise, find the closest
                        let closest = { dist: Number.POSITIVE_INFINITY, after: false, refElement: null };
                        draggableElements.forEach(child => {
                            const box = child.getBoundingClientRect();
                            const centerX = box.left + box.width / 2;
                            const centerY = box.top + box.height / 2;
                            const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                            if (dist < closest.dist) {
                                closest = {
                                    dist,
                                    after: (x > centerX || y > centerY),
                                    refElement: child
                                };
                            }
                        });
                        return { ...closest, isFirst: false, isLast: false };
                    }

                    // Touch support for mobile drag-and-drop
                    let touchStartY = 0;
                    let draggingElem = null;
                    imageContainer.addEventListener('touchstart', (e) => {
                        if (e.touches.length === 1) {
                            touchStartY = e.touches[0].clientY;
                            draggingElem = imageContainer;
                            setTimeout(() => {
                                draggingElem.classList.add('dragging');
                            }, 200); // long press
                        }
                    });
                    imageContainer.addEventListener('touchmove', (e) => {
                        if (draggingElem && e.touches.length === 1) {
                            const x = e.touches[0].clientX;
                            const y = e.touches[0].clientY;
                            const grid = gridElement;
                            const { after, refElement, isFirst, isLast } = getDropPosition(grid, x, y);
                            if (isFirst && refElement) {
                                grid.insertBefore(draggingElem, refElement);
                            } else if (isLast) {
                                grid.insertBefore(draggingElem, grid.lastElementChild);
                            } else if (refElement) {
                                if (after) {
                                    if (refElement.nextSibling) {
                                        grid.insertBefore(draggingElem, refElement.nextSibling);
                                    } else {
                                        grid.appendChild(draggingElem);
                                    }
                                } else {
                                    grid.insertBefore(draggingElem, refElement);
                                }
                            } else {
                                grid.insertBefore(draggingElem, grid.lastElementChild);
                            }
                        }
                    });
                    imageContainer.addEventListener('touchend', (e) => {
                        if (draggingElem) {
                            draggingElem.classList.remove('dragging');
                            draggingElem = null;
                        }
                    });

                    gridElement.insertBefore(imageContainer, gridElement.lastElementChild);
                };
                imgEl.src = originalDataUrl;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Helper to draw image with watermark (timestamp/location) for PDF/preview
async function getImageWithOverlay(originalDataUrl, addTimestamp, addLocation) {
    return new Promise((resolve) => {
        const imgEl = new window.Image();
        imgEl.onload = async function() {
            let locationString = '';
            if (addLocation && navigator.geolocation) {
                try {
                    const pos = await new Promise((res, rej) => {
                        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
                    });
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const data = await resp.json();
                    if (data && data.display_name) {
                        locationString = data.display_name;
                    } else if (data && data.address) {
                        locationString = [
                            data.address.road,
                            data.address.neighbourhood,
                            data.address.suburb,
                            data.address.city,
                            data.address.town,
                            data.address.village,
                            data.address.state,
                            data.address.country
                        ].filter(Boolean).join(', ');
                    }
                } catch {}
            }
            // Use the same drawImageWithWatermark logic, but return the dataUrl
            const canvas = document.createElement('canvas');
            canvas.width = imgEl.width;
            canvas.height = imgEl.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgEl, 0, 0);
            let dateTimeString = '';
            if (addTimestamp) {
                const now = new Date();
                dateTimeString = now.toLocaleString();
            }
            const fontSize = Math.floor(canvas.width / 20);
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            function wrapText(text, maxWidth) {
                if (!text) return [];
                const words = text.split(' ');
                let lines = [];
                let line = '';
                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = ctx.measureText(testLine);
                    const testWidth = metrics.width;
                    if (testWidth > maxWidth && n > 0) {
                        lines.push(line.trim());
                        line = words[n] + ' ';
                    } else {
                        line = testLine;
                    }
                }
                lines.push(line.trim());
                return lines;
            }
            let totalHeight = 0;
            let locationLines = [];
            const maxTextWidth = canvas.width * 0.9;
            if (addTimestamp) totalHeight += fontSize + 8;
            if (addLocation && locationString) {
                locationLines = wrapText(locationString, maxTextWidth);
                totalHeight += locationLines.length * fontSize;
            }
            let maxWidth = 0;
            if (addTimestamp) maxWidth = ctx.measureText(dateTimeString).width;
            if (addLocation && locationLines.length > 0) {
                locationLines.forEach(line => {
                    maxWidth = Math.max(maxWidth, ctx.measureText(line).width);
                });
            }
            const padding = 8;
            if (totalHeight > 0) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect((canvas.width - maxWidth) / 2 - padding, 0, maxWidth + 2 * padding, totalHeight);
            }
            let y = 4;
            ctx.fillStyle = 'white';
            if (addTimestamp) {
                ctx.fillText(dateTimeString, canvas.width / 2, y);
                y += fontSize + 8;
            }
            if (addLocation && locationLines.length > 0) {
                ctx.font = `${fontSize}px Arial`;
                locationLines.forEach(line => {
                    ctx.fillText(line, canvas.width / 2, y);
                    y += fontSize;
                });
            }
            resolve(canvas.toDataURL('image/jpeg'));
        };
        imgEl.src = originalDataUrl;
    });
}

// Show PDF name modal and handle PDF generation
function showPdfNameModal(onDownload) {
    const modal = document.getElementById('pdfNameModal');
    const input = document.getElementById('pdfFileNameInput');
    const okBtn = document.getElementById('pdfNameOk');
    const cancelBtn = document.getElementById('pdfNameCancel');
    input.value = 'all_sites_report.pdf';
    modal.classList.add('show');
    input.focus();

    function closeModal() {
        modal.classList.remove('show');
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
    }
    function onOk() {
        let fileName = input.value.trim();
        if (!fileName) fileName = 'all_sites_report.pdf';
        if (!fileName.toLowerCase().endsWith('.pdf')) fileName += '.pdf';
        closeModal();
        onDownload(fileName);
    }
    function onCancel() {
        closeModal();
    }
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') onOk();
        if (e.key === 'Escape') onCancel();
    });
}

// Update generateAllPDFs to show all 'Before' images first in a 3-column grid, then all 'After' images in a 3-column grid, with section headers. This works for both desktop and mobile.
async function generateAllPDFs(fileName = 'all_sites_report.pdf') {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const columns = 3;
    const spacing = 4;
    const imageWidth = (pageWidth - margin * 2 - spacing * (columns - 1)) / columns;
    const imageHeight = imageWidth * 0.78;
    const pageHeight = doc.internal.pageSize.getHeight();

    // Get current options
    const addTimestamp = document.getElementById('add-timestamp')?.checked;
    const addLocation = document.getElementById('add-location')?.checked;

    const siteSections = document.querySelectorAll('.site-section');
    for (let index = 0; index < siteSections.length; index++) {
        const siteSection = siteSections[index];
        if (index > 0) {
            doc.addPage();
        }

        const siteName = siteSection.querySelector('.site-name').value || 'Unnamed Site';
        const beforeImages = Array.from(siteSection.querySelectorAll('.image-preview')).filter(img => 
            img.closest('.before-section')
        ).map(img => img.closest('.image-container').dataset.original);
        const afterImages = Array.from(siteSection.querySelectorAll('.image-preview')).filter(img => 
            img.closest('.after-section')
        ).map(img => img.closest('.image-container').dataset.original);

        // Add site name (centered, bold, large)
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text(siteName, pageWidth / 2, 18, { align: 'center' });

        // BEFORE SECTION HEADER (centered, styled)
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Before', pageWidth / 2, 32, { align: 'center' });
        let y = 38;
        let x = margin;
        for (let i = 0; i < beforeImages.length; i++) {
            const img = await getImageWithOverlay(beforeImages[i], addTimestamp, addLocation);
            if (x + imageWidth > pageWidth - margin + 1e-2) {
                x = margin;
                y += imageHeight + spacing;
            }
            if (y + imageHeight > pageHeight - margin) {
                doc.addPage();
                doc.setFontSize(24);
                doc.setFont(undefined, 'bold');
                doc.text(siteName, pageWidth / 2, 18, { align: 'center' });
                doc.setFontSize(18);
                doc.setFont(undefined, 'bold');
                doc.text('Before', pageWidth / 2, 32, { align: 'center' });
                y = 38;
                x = margin;
            }
            doc.addImage(img, 'JPEG', x, y, imageWidth, imageHeight);
            x += imageWidth + spacing;
        }

        // AFTER SECTION HEADER (centered, styled)
        y += imageHeight + spacing * 2 + 18;
        x = margin;
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('After', pageWidth / 2, y - spacing, { align: 'center' });
        for (let i = 0; i < afterImages.length; i++) {
            const img = await getImageWithOverlay(afterImages[i], addTimestamp, addLocation);
            if (x + imageWidth > pageWidth - margin + 1e-2) {
                x = margin;
                y += imageHeight + spacing;
            }
            if (y + imageHeight > pageHeight - margin) {
                doc.addPage();
                doc.setFontSize(24);
                doc.setFont(undefined, 'bold');
                doc.text(siteName, pageWidth / 2, 18, { align: 'center' });
                doc.setFontSize(18);
                doc.setFont(undefined, 'bold');
                doc.text('After', pageWidth / 2, 32, { align: 'center' });
                y = 38;
                x = margin;
            }
            doc.addImage(img, 'JPEG', x, y, imageWidth, imageHeight);
            x += imageWidth + spacing;
        }
    }
    doc.save(fileName);
}

// Update previewAllPDFs to match the new design
async function previewAllPDFs() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const columns = 3;
    const spacing = 4;
    const imageWidth = (pageWidth - margin * 2 - spacing * (columns - 1)) / columns;
    const imageHeight = imageWidth * 0.78;
    const pageHeight = doc.internal.pageSize.getHeight();

    // Get current options
    const addTimestamp = document.getElementById('add-timestamp')?.checked;
    const addLocation = document.getElementById('add-location')?.checked;

    const siteSections = document.querySelectorAll('.site-section');
    for (let index = 0; index < siteSections.length; index++) {
        const siteSection = siteSections[index];
        if (index > 0) {
            doc.addPage();
        }

        const siteName = siteSection.querySelector('.site-name').value || 'Unnamed Site';
        const beforeImages = Array.from(siteSection.querySelectorAll('.image-preview')).filter(img => 
            img.closest('.before-section')
        ).map(img => img.closest('.image-container').dataset.original);
        const afterImages = Array.from(siteSection.querySelectorAll('.image-preview')).filter(img => 
            img.closest('.after-section')
        ).map(img => img.closest('.image-container').dataset.original);

        // Add site name (centered, bold, large)
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text(siteName, pageWidth / 2, 18, { align: 'center' });

        // BEFORE SECTION HEADER (centered, styled)
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Before', pageWidth / 2, 32, { align: 'center' });
        let y = 38;
        let x = margin;
        for (let i = 0; i < beforeImages.length; i++) {
            const img = await getImageWithOverlay(beforeImages[i], addTimestamp, addLocation);
            if (x + imageWidth > pageWidth - margin + 1e-2) {
                x = margin;
                y += imageHeight + spacing;
            }
            if (y + imageHeight > pageHeight - margin) {
                doc.addPage();
                doc.setFontSize(24);
                doc.setFont(undefined, 'bold');
                doc.text(siteName, pageWidth / 2, 18, { align: 'center' });
                doc.setFontSize(18);
                doc.setFont(undefined, 'bold');
                doc.text('Before', pageWidth / 2, 32, { align: 'center' });
                y = 38;
                x = margin;
            }
            doc.addImage(img, 'JPEG', x, y, imageWidth, imageHeight);
            x += imageWidth + spacing;
        }

        // AFTER SECTION HEADER (centered, styled)
        y += imageHeight + spacing * 2 + 18;
        x = margin;
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('After', pageWidth / 2, y - spacing, { align: 'center' });
        for (let i = 0; i < afterImages.length; i++) {
            const img = await getImageWithOverlay(afterImages[i], addTimestamp, addLocation);
            if (x + imageWidth > pageWidth - margin + 1e-2) {
                x = margin;
                y += imageHeight + spacing;
            }
            if (y + imageHeight > pageHeight - margin) {
                doc.addPage();
                doc.setFontSize(24);
                doc.setFont(undefined, 'bold');
                doc.text(siteName, pageWidth / 2, 18, { align: 'center' });
                doc.setFontSize(18);
                doc.setFont(undefined, 'bold');
                doc.text('After', pageWidth / 2, 32, { align: 'center' });
                y = 38;
                x = margin;
            }
            doc.addImage(img, 'JPEG', x, y, imageWidth, imageHeight);
            x += imageWidth + spacing;
        }
    }
    // Show PDF in preview area
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const previewArea = document.getElementById('pdf-preview-area');
    previewArea.innerHTML = `<iframe src="${url}"></iframe>`;
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
    document.getElementById('generate-all-pdf').addEventListener('click', () => {
        // Track PDF generation click
        if (typeof gtag !== 'undefined') {
            gtag('event', 'generate_pdf_click', {
                'event_category': 'PDF',
                'event_label': 'Generate PDF Button'
            });
        }
        showPdfNameModal((fileName) => generateAllPDFs(fileName));
    });

    // Preview PDF for all sites
    document.getElementById('preview-pdf').addEventListener('click', () => {
        // Track preview click
        if (typeof gtag !== 'undefined') {
            gtag('event', 'preview_pdf_click', {
                'event_category': 'PDF',
                'event_label': 'Preview PDF Button'
            });
        }
        previewAllPDFs();
    });

    // Setup initial site
    setupSiteEventListeners(document.querySelector('.site-section'));

    // Update initial section headers on page load
    document.querySelector('.before-section h2').textContent = 'Before Images (Max 15)';
    document.querySelector('.after-section h2').textContent = 'After Images (Max 15)';
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