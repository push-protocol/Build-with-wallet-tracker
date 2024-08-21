export const getDomainName = (url) => {
    try {
        // Create a new URL object
        const parsedUrl = new URL(url);
        // Get the hostname which includes subdomain, domain, and TLD
        const hostname = parsedUrl.hostname;

        // Split the hostname by dots
        const parts = hostname.split('.');

        // If there's a subdomain, the domain name is the second-to-last part
        // Otherwise, it's the first part of the hostname
        const domain = parts.length > 2 ? parts[parts.length - 2] : parts[0];

        // Capitalize the first letter of the domain and return it
        return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch (error) {
        // Handle invalid URLs
        console.error("Invalid URL:", error);
        return null;
    }
}