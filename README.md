# Before & After Image Report Generator

A web application that allows users to upload before and after images, manage them, and generate PDF reports.

## Features

- Upload up to 10 before and 10 after images per site
- Multiple site support
- Image preview with thumbnail display
- Delete or replace individual images
- Generate PDF reports with a clean layout
- Responsive design that works on both desktop and mobile devices

## How to Use

1. Open the application in your web browser
2. Enter a site name in the input field
3. Upload before and after images using the "+ Add" buttons
4. Click on any image to replace it
5. Use the "×" button to delete images
6. Click "Generate PDF Report" to create a PDF with all images
7. Use the "+ Add Another Site" button to create additional site sections

## Deployment to GitHub Pages

1. Create a new repository on GitHub
2. Upload all files to the repository
3. Go to repository Settings > Pages
4. Under "Source", select "main" branch and "/ (root)" folder
5. Click "Save"
6. Your site will be available at `https://[your-username].github.io/[repository-name]`

## Technical Details

- Built with vanilla JavaScript, HTML, and CSS
- Uses jsPDF library for PDF generation
- Responsive design using CSS Flexbox
- Mobile-friendly with support for camera uploads
- No server-side processing required

## Browser Support

The application works best in modern browsers that support:
- HTML5 File API
- CSS Flexbox
- JavaScript ES6+

## Limitations

- Maximum of 10 images per section (before/after)
- PDF generation might be slow with many high-resolution images
- Images are processed in the browser, so very large images might cause performance issues

## Development

To modify or extend the application:

1. Clone the repository
2. Open the files in your preferred code editor
3. Make changes to the HTML, CSS, or JavaScript files
4. Test the changes in a web browser
5. Push changes to GitHub to update the live site

## License

This project is open source and available under the MIT License. 