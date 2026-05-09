
const updateInvoiceNumber = async (tx, provider_id, franchise_id, invoice_type) => {
    const latestQuickSettings = await tx.quickSettings.findFirst({
        where: {
          provider_id: provider_id,
          franchise_id: franchise_id,
          invoice_type: invoice_type,
        },
        orderBy: {
          created_at: "desc", // Ensures we get the latest one
        },
      });

      if (!latestQuickSettings) {
        console.log("QuickSettings not found for provider and invoice type");
        
        throw new Error(
          `QuickSettings not found for provider and invoice type`
        );
      }

      // Step 2: Increment its sequence number
      const updatedQuickSettings = await tx.quickSettings.update({
        where: {
          id: latestQuickSettings.id,
        },
        data: {
          sequence_number: {
            increment: 1,
          },
        },
      });

      return updatedQuickSettings;
}

export default updateInvoiceNumber;