import { DebitNote, Provider, PurchaseInvoice, PurchaseOrder, PurchaseReturn } from "../prisma/db-models.js";

const generateInvoiceNumber = async (user_id) => {
  // Find the provider based on user_id
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id
    }
  });
  
  const company_name = provider.company_name;
  
  // Split the company name into words
  const words = company_name.split(/\s+/).filter(word => word.length > 0);
  
  // Generate prefix based on number of words
  let prefix = '';
  
  if (words.length === 1) {
    // If one word, take first 4 letters (or the entire word if shorter)
    prefix = words[0].substring(0, 4).toUpperCase();
  } else if (words.length === 2) {
    // If two words, take first 2 letters from each word
    prefix = (words[0].substring(0, 2) + words[1].substring(0, 2)).toUpperCase();
  } else {
    // If 3+ words, take first letter of each of first 4 words (or fewer if there are less than 4 words)
    for (let i = 0; i < Math.min(words.length, 4); i++) {
      prefix += words[i].charAt(0).toUpperCase();
    }
  }
  
  // Find the latest invoice number with this prefix to determine the next sequence number
  const latest_invoice = await PurchaseInvoice.findFirst({
    where: {
      purchase_invoice_number: {
        startsWith: prefix
      }
    },
    orderBy: {
      purchase_invoice_number: 'desc'
    }
  });
  
  let sequence_number = 1;
  
  if (latest_invoice) {
    // Extract the sequence number from the latest invoice number
    const latest_sequence_str = latest_invoice.purchase_invoice_number.substring(prefix.length);
    const latest_sequence = parseInt(latest_sequence_str, 10);
    
    if (!isNaN(latest_sequence)) {
      sequence_number = latest_sequence + 1;
    }
  }
  
  // Format the sequence number with leading zeros
  const formatted_sequence = sequence_number.toString().padStart(3, '0');
  
  // Combine prefix and sequence number
  const purchase_invoice_number = prefix + formatted_sequence;
  
  return purchase_invoice_number;
};

// Example usage:
// generateInvoiceNumber('user123')
//   .then(invoice_number => console.log(invoice_number))
//   .catch(error => console.error(error));

const generateOrderNumber = async (user_id) => {
  // Find the provider based on user_id
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id
    }
  });
  
  const company_name = provider.company_name;
  
  // Split the company name into words
  const words = company_name.split(/\s+/).filter(word => word.length > 0);
  
  // Generate prefix based on number of words
  let prefix = '';
  
  if (words.length === 1) {
    // If one word, take first 4 letters (or the entire word if shorter)
    prefix = words[0].substring(0, 4).toUpperCase();
  } else if (words.length === 2) {
    // If two words, take first 2 letters from each word
    prefix = (words[0].substring(0, 2) + words[1].substring(0, 2)).toUpperCase();
  } else {
    // If 3+ words, take first letter of each of first 4 words (or fewer if there are less than 4 words)
    for (let i = 0; i < Math.min(words.length, 4); i++) {
      prefix += words[i].charAt(0).toUpperCase();
    }
  }
  
  // Find the latest invoice number with this prefix to determine the next sequence number
  const latest_order = await PurchaseOrder.findFirst({
    where: {
      purchase_order_number: {
        startsWith: prefix
      }
    },
    orderBy: {
      purchase_order_number: 'desc'
    }
  });
  
  let sequence_number = 1;
  
  if (latest_order) {
    // Extract the sequence number from the latest invoice number
    const latest_sequence_str = latest_order.purchase_order_number.substring(prefix.length);
    const latest_sequence = parseInt(latest_sequence_str, 10);
    
    if (!isNaN(latest_sequence)) {
      sequence_number = latest_sequence + 1;
    }
  }
  
  // Format the sequence number with leading zeros
  const formatted_sequence = sequence_number.toString().padStart(3, '0');
  
  // Combine prefix and sequence number
  const purchase_order_number = prefix + formatted_sequence;
  
  return purchase_order_number;
};

const generatePurchaseReturnNumber = async (user_id) => {
  // Find the provider based on user_id
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id
    }
  });
  
  const company_name = provider.company_name;
  
  // Split the company name into words
  const words = company_name.split(/\s+/).filter(word => word.length > 0);
  
  // Generate prefix based on number of words
  let prefix = '';
  
  if (words.length === 1) {
    // If one word, take first 4 letters (or the entire word if shorter)
    prefix = words[0].substring(0, 4).toUpperCase();
  } else if (words.length === 2) {
    // If two words, take first 2 letters from each word
    prefix = (words[0].substring(0, 2) + words[1].substring(0, 2)).toUpperCase();
  } else {
    // If 3+ words, take first letter of each of first 4 words (or fewer if there are less than 4 words)
    for (let i = 0; i < Math.min(words.length, 4); i++) {
      prefix += words[i].charAt(0).toUpperCase();
    }
  }
  
  // Find the latest invoice number with this prefix to determine the next sequence number
  const latest_order = await PurchaseReturn.findFirst({
    where: {
      purchase_return_number: {
        startsWith: prefix
      }
    },
    orderBy: {
      purchase_return_number: 'desc'
    }
  });
  
  let sequence_number = 1;
  
  if (latest_order) {
    // Extract the sequence number from the latest invoice number
    const latest_sequence_str = latest_order.purchase_return_number.substring(prefix.length);
    const latest_sequence = parseInt(latest_sequence_str, 10);
    
    if (!isNaN(latest_sequence)) {
      sequence_number = latest_sequence + 1;
    }
  }
  
  // Format the sequence number with leading zeros
  const formatted_sequence = sequence_number.toString().padStart(3, '0');
  
  // Combine prefix and sequence number
  const purchase_return_number = prefix + formatted_sequence;
  
  return purchase_return_number;
};

const generateDebitNoteNumber = async (user_id) => {
  // Find the provider based on user_id
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id
    }
  });
  
  const company_name = provider.company_name;
  
  // Split the company name into words
  const words = company_name.split(/\s+/).filter(word => word.length > 0);
  
  // Generate prefix based on number of words
  let prefix = '';
  
  if (words.length === 1) {
    // If one word, take first 4 letters (or the entire word if shorter)
    prefix = words[0].substring(0, 4).toUpperCase();
  } else if (words.length === 2) {
    // If two words, take first 2 letters from each word
    prefix = (words[0].substring(0, 2) + words[1].substring(0, 2)).toUpperCase();
  } else {
    // If 3+ words, take first letter of each of first 4 words (or fewer if there are less than 4 words)
    for (let i = 0; i < Math.min(words.length, 4); i++) {
      prefix += words[i].charAt(0).toUpperCase();
    }
  }
  
  // Find the latest invoice number with this prefix to determine the next sequence number
  const latest_order = await DebitNote.findFirst({
    where: {
      debit_note_number: {
        startsWith: prefix
      }
    },
    orderBy: {
      debit_note_number: 'desc'
    }
  });
  
  let sequence_number = 1;
  
  if (latest_order) {
    // Extract the sequence number from the latest invoice number
    const latest_sequence_str = latest_order.debit_note_number.substring(prefix.length);
    const latest_sequence = parseInt(latest_sequence_str, 10);
    
    if (!isNaN(latest_sequence)) {
      sequence_number = latest_sequence + 1;
    }
  }
  
  // Format the sequence number with leading zeros
  const formatted_sequence = sequence_number.toString().padStart(3, '0');
  
  // Combine prefix and sequence number
  const debit_note_number = prefix + formatted_sequence;
  
  return debit_note_number;
};


export { generateInvoiceNumber , generateOrderNumber  ,  generatePurchaseReturnNumber ,  generateDebitNoteNumber};