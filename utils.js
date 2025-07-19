//Cleans up user input phone number so db list are same format and just numeric digits
export function cleanPhoneNumber(phone) {
    if (!phone || phone.trim() === '') return null;
    
    const hasPlus = phone.trim().startsWith('+');
    const digits = phone.replace(/\D/g, '');
    
    if (!digits || digits.length < 10) return null;
    
    return hasPlus ? '+' + digits : digits;
}

//handle whitespace and return cleaned value
export function scrubCompany(company) {
    if (!company || company.trim() === '') return null;
    return company.trim(); // Return the cleaned company name
}

function octetsToMB(octets) {
    return (octets / (1024 * 1024)).toFixed(2);
}