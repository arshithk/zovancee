import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // 11 Service Pages
        zohoConsulting: resolve(__dirname, 'zoho-consulting/index.html'),
        zohoCrmImplementation: resolve(__dirname, 'zoho-crm-implementation/index.html'),
        zohoBooks: resolve(__dirname, 'zoho-books/index.html'),
        zohoCreatorDevelopment: resolve(__dirname, 'zoho-creator-development/index.html'),
        zohoAnalytics: resolve(__dirname, 'zoho-analytics/index.html'),
        businessAutomation: resolve(__dirname, 'business-automation/index.html'),
        itSolutions: resolve(__dirname, 'it-solutions/index.html'),
        technologyConsulting: resolve(__dirname, 'technology-consulting/index.html'),
        systemIntegration: resolve(__dirname, 'system-integration/index.html'),
        customSoftwareDevelopment: resolve(__dirname, 'custom-software-development/index.html'),
        digitalTransformation: resolve(__dirname, 'digital-transformation/index.html'),
        // Blog Hub & 6 Articles
        blog: resolve(__dirname, 'blog/index.html'),
        blogZohoCrm: resolve(__dirname, 'blog/how-zoho-crm-helps-businesses-manage-customers/index.html'),
        blogBusinessAutomation: resolve(__dirname, 'blog/how-business-automation-reduces-manual-work/index.html'),
        blogZohoBooks: resolve(__dirname, 'blog/zoho-books-for-growing-businesses/index.html'),
        blogSystemIntegration: resolve(__dirname, 'blog/benefits-of-integrating-business-applications/index.html'),
        blogChooseSoftware: resolve(__dirname, 'blog/how-to-choose-the-right-business-software/index.html'),
        blogDigitalTransformation: resolve(__dirname, 'blog/digital-transformation-for-small-and-medium-businesses/index.html'),
        // 3 Locations
        locationSalem: resolve(__dirname, 'locations/salem/index.html'),
        locationChennai: resolve(__dirname, 'locations/chennai/index.html'),
        locationBangalore: resolve(__dirname, 'locations/bangalore/index.html'),
        // 404 Error Page
        notFound: resolve(__dirname, '404.html'),
      },
    },
  },
});
