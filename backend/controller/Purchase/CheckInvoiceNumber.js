const checkInvoiceNumberExists = async (provider_id, franchise_id, staff_id, invoice_number, invoice_type, tx) => {

  console.log("invoice_number", invoice_number);
  console.log("invoice_type in func", invoice_type);
  
  
  const existingInvoice = await tx.purchaseInvoice.findFirst({
        where: {
          provider_id: provider_id,
          franchise_id: franchise_id,
          invoice_number: invoice_number,
          invoice_type: invoice_type,
          ...(staff_id ? { staff_id: staff_id } : {}),
        },
      });
      console.log("existingInvoice", existingInvoice);

     if(existingInvoice){
        return true;
     }
     else{
        return false;
     }
     
}

export { checkInvoiceNumberExists };