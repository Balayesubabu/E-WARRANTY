import {Provider, ProviderCustomers, ProviderCustomerVehicle, Booking, BookingTransactional, VehicleBookingOthers, BookingCustomerRequirements, BookingParts, BookingServicePackages, BookingServices, BookingTechnicians, FranchiseService,BookingQualityChecks, BookingWorkDetails, FranchiseOpenInventoryTransaction, BookingWorkDetailsTransactions} from '../../../../prisma/db-models.js';

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}
const createProviderCustomer = async (data, provider_id, franchise_id) => {
    const existingCustomer = await ProviderCustomers.findFirst({
        where: {
            customer_email: data.customer_email,
            customer_phone: data.customer_phone,
            customer_type: data.customer_type,
            customer_name: data.customer_name,
            provider_id: provider_id
        }
    });

    if (existingCustomer) {
        return existingCustomer;
    }
    const customer = await ProviderCustomers.create({
        data: {
            customer_name: data.customer_name,
            customer_email: data.customer_email,
            customer_address: data.customer_address,
            customer_country_code: data.customer_country_code,
            customer_phone: data.customer_phone,
            customer_type: data.customer_type,
            customer_gstin_number: data.customer_gstin_number || null,
            provider_id: provider_id,
            created_at: new Date()
        }
    });

    return customer;
};
const createProviderCustomerVehicle = async (data, provider_id, franchise_id, customer_id) => {
  const existingVehicle = await ProviderCustomerVehicle.findFirst({
    where: {
      vehicle_number: data.vehicle_number,
      vehicle_model: data.vehicle_model,
      vehicle_type: data.vehicle_type,
      provider_customer_id: customer_id
    }
  });

  if (existingVehicle) {
    return existingVehicle;
  }

  const vehicle = await ProviderCustomerVehicle.create({
    data: {
      vehicle_number: data.vehicle_number,
      vehicle_model: data.vehicle_model,
      vehicle_type: data.vehicle_type,
      vehicle_color: data.vehicle_color || null,
      provider_customer_id: customer_id,
      created_at: new Date()
    }
  });

  return vehicle;
};  

const createVehicleBookingOthers = async (data, provider_id, franchise_id, staff_id, booking_id) => {
  const vehicleBooking = await VehicleBookingOthers.upsert({
  where: {
    booking_id: booking_id
  },
  update: {
    dents_images: data.dents_images || [],
    personal_belongings: data.personal_belongings || [],
    additional_information: data.additional_information || [],
    updated_at: new Date(),
    updated_by: staff_id || provider_id
  },
  create: {
    provider_id,
    franchise_id,
    booking_id,
    dents_images: data.dents_images || [],
    personal_belongings: data.personal_belongings || [],
    additional_information: data.additional_information || [],
    created_at: new Date(),
    created_by: staff_id || provider_id
  }
});
  return vehicleBooking;
};
const createBooking = async (data, provider_id, franchise_id, staff_id, customer_id, vehicle_id) => {
  if(data.booking_id){
    console.log("updating booking");
    const existingBooking = await Booking.update({
      where: {
        id: data.booking_id,
        provider_id: provider_id,
        franchise_id: franchise_id
      },
      data: {
      provider_id: provider_id,
      franchise_id: franchise_id,
      staff_id: staff_id,
      customer_id: customer_id,
      vehicle_id: vehicle_id,
      alternative_country_code_phone: data.alternative_country_code_phone,
      alternative_phone: data.alternative_phone,
      is_technician: data.is_technician,
      is_workdetails: data.is_workdetails,
      is_quality_check: data.is_quality_check,
      estimated_cost: data.estimated_cost || 0,
      status: data.status || 'New',
      estimated_date: data.estimated_date || null,
      remarks: data.remarks || null,
      updated_at: new Date(),
      updated_by: staff_id || provider_id
    }
    });
    return existingBooking;

  }
  else{
    const existingBooking = await Booking.findFirst({
      where: {
        booking_number: data.booking_number,
        provider_id: provider_id,
        franchise_id: franchise_id
      }
    });
    if (existingBooking) {
      return false;
    }
    const newBooking = await Booking.create({
      data:  {
      booking_number: data.booking_number,
      provider_id: provider_id,
      franchise_id: franchise_id,
      staff_id: staff_id,
      customer_id: customer_id,
      vehicle_id: vehicle_id,
      alternative_country_code_phone: data.alternative_country_code_phone,
      alternative_phone: data.alternative_phone,
      is_technician: data.is_technician,
      is_workdetails: data.is_workdetails,
      is_quality_check: data.is_quality_check,
      estimated_cost: data.estimated_cost || 0,
      status: data.status || 'New',
      estimated_date: data.estimated_date || null,
      remarks: data.remarks || null,
      is_active: true,
      created_at: new Date(),
      created_by: staff_id || provider_id
    }
    });
    return newBooking;
  }
};

const createBookingTransactional = async (data, provider_id, franchise_id, staff_id, booking_id) => {
  const existingTransaction = await BookingTransactional.findFirst({
    where: {
      booking_id: booking_id,
      provider_id: provider_id,
      franchise_id: franchise_id,
      total_amount: data.total_amount,
      amount: data.amount,
      due_amount: data.due_amount

    }
  });
  if (existingTransaction) {
    return existingTransaction;
  }
  const bookingTransactional = await BookingTransactional.create({
    data: {
      provider_id: provider_id,
      franchise_id: franchise_id,
      booking_id: booking_id,
      total_amount: data.total_amount || 0,
      amount: data.amount || 0,
      payment_type: data.payment_type || null,
      transaction_id: data.transaction_id || null,
      due_amount: data.due_amount || 0,
      created_at: new Date(),
      created_by: staff_id || provider_id
    }
  });
  return bookingTransactional;
};

const createBookingCustomerRequirements = async (data,booking_id,provider_id,franchise_id,staff_id) => {
    const deletedRequirements = await BookingCustomerRequirements.deleteMany({
        where: {
            booking_id: booking_id,
            provider_id: provider_id,
            franchise_id: franchise_id,
        }
    });
    const requirementsList = [];
    for (const requirementData of data) {
        const requirement = await BookingCustomerRequirements.create({
            data: {
                booking_id: booking_id,
                franchise_id: franchise_id,
                provider_id: provider_id,
                requirement_id: requirementData.requirement_id,
                requirement_name: requirementData.requirement_name,
                created_at: new Date(),
                created_by: staff_id || provider_id
            },
        });
        requirementsList.push(requirement);
    }
    return requirementsList;
}

const createBookingParts = async (data,booking_id,provider_id,franchise_id,staff_id) => {
  const partsList = [];
  for (const partData of data) {  
    const existingPart = await BookingParts.findFirst({
      where: {
        booking_id: booking_id,
        provider_id: provider_id,
        franchise_id: franchise_id,
        franchise_open_inventory_id: partData.franchise_open_inventory_id
      }
    });

    let checkPart;
    if (existingPart) {
      checkPart = await BookingParts.update({
        where: { id: existingPart.id },
        data: {
          franchise_open_inventory_name: partData.franchise_open_inventory_name,
          unit: partData.unit,
          price: partData.price,
          gst: partData.gst,
          total_price: partData.total_price,
          updated_at: new Date(),
          updated_by: staff_id || provider_id
        }
      });
    } else {
      checkPart = await BookingParts.create({
        data: {
          booking_id,
          provider_id,
          franchise_id,
          franchise_open_inventory_id: partData.franchise_open_inventory_id,
          franchise_open_inventory_name: partData.franchise_open_inventory_name,
          unit: partData.unit,
          price: partData.price,
          gst: partData.gst,
          total_price: partData.total_price,
          created_at: new Date(),
          created_by: staff_id || provider_id
        }
      });
    }
    partsList.push(checkPart);    
}
const groupedParts = await BookingParts.findMany({
    where: {
        booking_id: booking_id,
        provider_id: provider_id,
        franchise_id: franchise_id,
    },
    distinct: ['franchise_open_inventory_id']

});
const list1 = groupedParts;
const list2Names = data.map(col => col.franchise_open_inventory_id);
const notInList2 = list1.filter(col => !list2Names.includes(col.franchise_open_inventory_id));
if(notInList2 && notInList2.length > 0){
    for(const item of notInList2){
        console.log(item);
        const getBookingWorkDetailsId = await BookingWorkDetails.findFirst({
            where: {
                booking_id: booking_id,
                provider_id: provider_id,
                franchise_id: franchise_id,
                booking_part_id: item.id
            }
        });
        if(getBookingWorkDetailsId){
            const deleteWorkDetailsTransactions = await BookingWorkDetailsTransactions.deleteMany({
                where: {
                  booking_work_details_id: getBookingWorkDetailsId.id
                }
              });
        }
        const deleteWorkDetails = await BookingWorkDetails.deleteMany({
            where: {
                booking_id: booking_id,
                provider_id: provider_id,
                franchise_id: franchise_id,
                booking_part_id: item.id
            }
        });
        const deletedPart = await BookingParts.deleteMany({
            where: {
                id:item.id,
                booking_id: booking_id,
                provider_id: provider_id,
                franchise_id: franchise_id,
                franchise_open_inventory_id: item.franchise_open_inventory_id
            }
        });
    }
}
  return partsList;  
}

const createBookingService = async (data, booking_id, provider_id, franchise_id, staff_id) => {
    const serviceList = [];
    for (const serviceData of data) {
      const existing = await BookingServices.findFirst({
        where: {
          booking_id,
          provider_id,
          franchise_id,
          franchise_service_id: serviceData.franchise_service_id
        }
      });

      let service;

      if (existing) {
        service = await BookingServices.update({
          where: { id: existing.id },
          data: {
            franchise_service_name: serviceData.franchise_service_name,
            unit: serviceData.unit,
            price: serviceData.price,
            total_price: serviceData.total_price,
            sac_number: serviceData.sac_number || null,
            gst: serviceData.gst || 0,
            updated_at: new Date(),
            updated_by: staff_id || provider_id
          }
        });
      } else {
        service = await BookingServices.create({
          data: {
            booking_id,
            franchise_id,
            provider_id,
            franchise_service_id: serviceData.franchise_service_id,
            franchise_service_name: serviceData.franchise_service_name,
            unit: serviceData.unit,
            price: serviceData.price,
            total_price: serviceData.total_price,
            sac_number: serviceData.sac_number || null,
            gst: serviceData.gst || 0,
            created_at: new Date(),
            created_by: staff_id || provider_id
          }
        });
      }

      serviceList.push(service);
    }

    const groupedServices = await BookingServices.findMany({
        where: {
            booking_id: booking_id,
            provider_id: provider_id,
            franchise_id: franchise_id,
        },
        distinct: ['franchise_service_id']
    });
    const list1 = groupedServices;
    const list2Names = data.map(col => col.franchise_service_id);
    const notInList2 = list1.filter(col => !list2Names.includes(col.franchise_service_id));
    if(notInList2 && notInList2.length > 0){
        for(const item of notInList2){
            console.log(item);
            const getBookingWorkDetailsId = await BookingWorkDetails.findFirst({
                where: {
                    booking_id: booking_id,
                    provider_id: provider_id,
                    franchise_id: franchise_id,
                    booking_service_id: item.id
                }
            });
            if(getBookingWorkDetailsId){
                const deleteWorkDetailsTransactions = await BookingWorkDetailsTransactions.deleteMany({
                    where: {
                      booking_work_details_id: getBookingWorkDetailsId.id
                    }
                  });
            }
            const deleteWorkDetails = await BookingWorkDetails.deleteMany({
                where: {
                    booking_id: booking_id,
                    provider_id: provider_id,
                    franchise_id: franchise_id,
                    booking_service_id: item.id
                }
            });
            const deletedService = await BookingServices.deleteMany({
                where: {
                    booking_id: booking_id,
                    provider_id: provider_id,
                    franchise_id: franchise_id,
                    id: item.id
                }
            });
        }
    }
    return serviceList;
}

const createBookingServicesPackage = async (data,booking_id,provider_id,franchise_id,staff_id) => {
    const packageList = [];
    for (const packageData of data) {
      console.log(packageData);
      const existingPackage = await BookingServicePackages.findFirst({
        where: {
          booking_id: booking_id,
          franchise_id: franchise_id,
          provider_id: provider_id,
          franchise_service_package_id: packageData.franchise_service_package_id
        }
      });

      let servicePackage;

      if (existingPackage) {
        servicePackage = await BookingServicePackages.update({
          where: { id: existingPackage.id },
          data: {
            unit: packageData.unit,
            price: packageData.price,
            total_price: packageData.total_price,
            updated_at: new Date(),
            updated_by: staff_id || provider_id
          }
        });
      } else {
        servicePackage = await BookingServicePackages.create({
          data: {
            booking_id: booking_id,
            franchise_id: franchise_id,
            provider_id: provider_id,
            franchise_service_package_id: packageData.franchise_service_package_id,
            franchise_service_package_name: packageData.franchise_service_package_name,
            unit: packageData.unit,
            price: packageData.price,
            total_price: packageData.total_price,
            created_at: new Date(),
            created_by: staff_id || provider_id
          }
        });
      }

      packageList.push(servicePackage);
    }



    return packageList;
}

const createBookingTechnicians = async (data,booking_id,provider_id,franchise_id,staff_id) => {
    const techniciansList = [];
    for (const technicianData of data) {
      const existingTech = await BookingTechnicians.findFirst({
        where: {
          booking_id: booking_id,
          franchise_id: franchise_id,
          provider_id: provider_id,
          staff_id: technicianData.staff_id
        }
      });

      let technician;
      if (existingTech) {
        technician = await BookingTechnicians.update({
          where: { id: existingTech.id },
          data: {
            staff_name: technicianData.staff_name,
            staff_department: technicianData.staff_department,
            updated_at: new Date(),
            updated_by: staff_id || provider_id
          }
        });
      } else {
        technician = await BookingTechnicians.create({
          data: {
            booking_id: booking_id,
            franchise_id: franchise_id,
            provider_id: provider_id,
            staff_id: technicianData.staff_id,
            staff_name: technicianData.staff_name,
            staff_department: technicianData.staff_department,
            created_at: new Date(),
            created_by: staff_id || provider_id
          }
        });
      }

      techniciansList.push(technician);
      console.log(technician);
    }

    const groupedTechnicians = await BookingTechnicians.findMany({
        where: {
            booking_id: booking_id,
            provider_id: provider_id,
            franchise_id: franchise_id,
        },
        distinct: ['staff_id','booking_id']
    });
    const list1 = groupedTechnicians;
    const list2Names = data.map(col => col.staff_id);
    const notInList2 = list1.filter(col => !list2Names.includes(col.staff_id));
    if(notInList2 && notInList2.length > 0){
        for(const item of notInList2){
            console.log(item);
            const getBookingWorkDetailsId = await BookingWorkDetails.findFirst({
                where: {
                    booking_id: booking_id,
                    provider_id: provider_id,
                    franchise_id: franchise_id,
                    booking_technician_id: item.id
                }
            });
            if(getBookingWorkDetailsId){
                const deleteWorkDetailsTransactions = await BookingWorkDetailsTransactions.deleteMany({
                    where: {
                      booking_work_details_id: getBookingWorkDetailsId.id
                    }
                  });
            }
            const deleteWorkDetails = await BookingWorkDetails.deleteMany({
                where: {
                    booking_id: booking_id,
                    provider_id: provider_id,
                    franchise_id: franchise_id,
                    booking_technician_id: item.id
                }
            });
            const deletedTechnician = await BookingTechnicians.deleteMany({
                where: {
                    booking_id: booking_id,
                    provider_id: provider_id,
                    franchise_id: franchise_id,
                    id: item.id
                } 
            });
        }
    } 

    return techniciansList;
}

const getAllServicesWithChecksListForBooking = async (services) => {
    const servicesWithChecks = [];
        for (const service of services) {
          const franchiseService = await FranchiseService.findFirst({
            where: { id: service.franchise_service_id }
          });
            if(franchiseService && franchiseService.check_list && franchiseService.check_list.length > 0){
                for(const check of franchiseService.check_list){
                  if(check && check.quality_check_name){
                    servicesWithChecks.push(check.quality_check_name);
                  }
                    
                }
            }
        }
    return servicesWithChecks;
}

const createBookingQualityChecks = async (booking_id,checklist,provider_id,franchise_id,staff_id) => {
    const deletedChecks = await BookingQualityChecks.deleteMany({
        where: {
            booking_id: booking_id,
            provider_id: provider_id,
            franchise_id: franchise_id,
        }
    });
    const checkList = [];
    for (const check of checklist) {
        const bookingCheck = await BookingQualityChecks.create({
            data: {
                booking_id: booking_id,
                provider_id: provider_id,
                franchise_id: franchise_id,
                quality_check_name: check,
                created_at: new Date(),
                created_by: staff_id || provider_id
            }
        });
        checkList.push(bookingCheck);
    }
    console.log(checkList);
    return checkList;
}

const createCosumedParts = async (data, booking_id, provider_id, franchise_id) => {
    const deletedConsumedParts = await FranchiseOpenInventoryTransaction.deleteMany({
        where: {
            booking_id: booking_id,
            provider_id: provider_id,
            franchise_id: franchise_id,
        }
    });
    const consumedPartsList = [];
    for (const partData of data) {
        const consumedPart = await FranchiseOpenInventoryTransaction.create({
            data: {
                booking_id: booking_id,
                franchise_id: franchise_id,
                provider_id: provider_id,
                franchise_open_inventory_id: partData.franchise_open_inventory_id,
                action:'reduce',
                stock_changed_type:partData.stock_changed_type,
                measurement: partData.measurement,
                measurement_unit: partData.measurement_unit,
                stock_changed_by: 'jobCard',
                created_at: new Date()
            },
        });
        consumedPartsList.push(consumedPart);
    }
    return consumedPartsList;    
}



export { getProviderByUserId, createBooking, createProviderCustomer, createProviderCustomerVehicle, createVehicleBookingOthers, createBookingTransactional, createBookingCustomerRequirements, createBookingParts, createBookingService, createBookingServicesPackage, createBookingTechnicians,getAllServicesWithChecksListForBooking, createBookingQualityChecks,createCosumedParts };