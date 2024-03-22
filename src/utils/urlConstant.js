module.exports.basePath = "/user/v1";

// User's Endpoint
module.exports.sendMail = "/sendMail";
module.exports.contactUs = "/contactus";
module.exports.sendLink = "/sendLink";
module.exports.createUpdateUserFromAdmin = "/from-admin-portal";
module.exports.createUser = "/createUser";
module.exports.updateUser = "/updateUser";
module.exports.updateMyProfile = "/updateMyProfile";
module.exports.getUserById = "/getUserById";
module.exports.getAllUser = "/getAllUser";
module.exports.getAllUsersByCreatedById = "/getAllUsersByCreatedById";
module.exports.getUsersByClientIdAndAuthUserIds = "/by-client-auth-userids";
module.exports.createRole = "/createRole";
module.exports.updateRole = "/updateRole";
module.exports.getAllRoles = "/getAllRoles";
module.exports.createPermission = "/createPermission";
module.exports.updatePermission = "/updatePermission";
module.exports.getAllPermissions = "/getAllPermissions";
module.exports.addUserRoles = "/addUserRoles";
module.exports.updateUserRoles = "/updateUserRoles";
module.exports.getUserRolesById = "/getUserRolesById";
module.exports.addRolesWithPermission = "/addRolesWithPermission";
module.exports.updateRolesWithPermission = "/updateRolesWithPermission";
module.exports.getRolesWithPermissionById = "/getRolesWithPermissionById";

//Allocation Endpoint
module.exports.allowcationBasePath = "/allocation/v1";
module.exports.createForecast = "/forecast/create";
module.exports.createCarrier = "";

// Create Carrier allocation new
module.exports.carrierAllocation = "/carrier/create";

// Update values
module.exports.updateCarrierAllocation = "/carrier/update/allocation/:ca_id";

// Update target values
module.exports.updateTargetValues = "/carrier/update/week/:ca_id";

// Define Target Values
module.exports.carrierAllocationDefineTargetValue = "/carrier/create/define-target";

//get Week start and end
module.exports.getWeekStartEnd = "/week/start-end";

// Fetch all the carrier allocation
module.exports.fetchCarrierAllocation = "/carrier/fetch";

// Fetch all the customer allocation
module.exports.fetchCustomerAllocation = "/carrier/customer/:ca_id";

// Fetch all the week allocation
module.exports.fetchWeekAllocation = "/carrier/week/fetch/:ca_id";

// Search Allocation By Id
module.exports.searchAllocationById = "/Carrier-details/:id";

// Search Allocation like
module.exports.searchAllocationLike = "/Carrier/search";

// Delete target values
module.exports.deleteTargetValues = "/carrier/delete/:ca_id";

// On load carrier allocation page
module.exports.onLoadCarrierAllocation = "/carrier/onload";
module.exports.downloadExcelPath = "/carrier/download";

//Dashboard Endpoint
module.exports.dashboardBasePath = "/dashboard"
module.exports.croneJobs = "/crone-jobs"
module.exports.QuotationBasePath = "/quotation/fetch"
module.exports.QuotationBasePathById = "/quotation/fetchById"

module.exports.tierMargins = "/quotation/tier-margins"
module.exports.tierMarginsById = "/quotation/tier-margins/tierMarginsById/:id"
module.exports.updateTierMargins = "/quotation/tier-margins/:id"
module.exports.createTierMargins = "/quotation/tier-margins/create"



module.exports.QuotationCreateBasePath = "/quotation/create"
module.exports.QuotationUpdateBasePath = "/quotation/update"
module.exports.OnLoadQoutation = "/quotation/on-load"
module.exports.quotationCompanyDetails = "/quotation-details";
module.exports.quotationSearchRates = "/quotation/search/rates";
module.exports.myQuotations = "/my-quotations";
module.exports.myQuotationsWithIdParam = "/my-quotations/:id";
module.exports.downloadMyQuotationPDF = "/my-quotations/download/pdf";
module.exports.saveMyQuotation = "/my-quotations/save";
module.exports.shareMyQuotation = "/my-quotations/share";
module.exports.sendFlashRate = "/flash-rate/send";
module.exports.confirmSearchQuote = "/search-quote/confirm";
module.exports.sendSearchQuote = "/search-quote/sendApproval";
module.exports.shareMyQuotationViaWhatsApp = "/my-quotations/share/whatsapp";
module.exports.shareMyQuotationViaMail = "/my-quotations/share/mail";
module.exports.myQuotationsByCurrentUser = "/my-quotations/by-current-user";
module.exports.insertQuotationCompanyDetails = "/insert-quotation-details";
module.exports.updateQuotationCompanyDetails = "/update-quotation-details/:id";
module.exports.QuotationGetCharges = "/quotation/get-charges";
module.exports.QuotationInsertExtraLocalCharges = "/quotation/insert-extra-local-charges";
module.exports.QuotationDeleteExtraLocalCharges = "/quotation/delete-extra-local-charges/:id";
module.exports.QuotationUpdateExtraLocalCharges = "/quotation/update-extra-local-charges/:id";
module.exports.getContractNumbers = "/contract/numbers";
module.exports.demurrageAndDetention = "/demurrage-and-detention/get-fetch";
module.exports.myQuotationsAnalyticsMonthWise = "/my-quotations/analytics/month-wise";
module.exports.myQuotationsAnalyticsSummary = "/my-quotations/analytics/summary";
module.exports.myQuotationsAnalyticsMaxPortSummary = "/my-quotations/analytics/max-port-summary";
module.exports.myQuotationsAnalyticsForCurrentWeek = "/my-quotations/analytics/current-week";
module.exports.myQuotationsAnalyticsForCurrentMonth = "/my-quotations/analytics/current-month";
module.exports.allPortsPath = "/ports";

module.exports.getQuotationsCount = "/quotations/analytics/count";
module.exports.getQuotationsTrend = "/quotations/analytics/trend";
module.exports.getContractsCount="/contracts/analytics/count";
// Customer module endpoint
module.exports.customerbaseUrl = "/customer/v1";
module.exports.fetchCustomerDetails = "/customer-details";
module.exports.companies = "/companies";
module.exports.createCustomerDetails = "/customer-create";
module.exports.updateCustomerDetails = "/customer-update/:customer_id";
module.exports.deleteCustomerDetails = "/customer-delete/:customer_id";
module.exports.searchCustomerById = "/customer-details/:id";
module.exports.getCustomerByEmailId = "/customer-details/by-email";
module.exports.searchCustomerLike = "/customer/search";
module.exports.sendMailNotificationForNoRates = "/send-no-rate-email";
module.exports.deleteCustomerDetailsBulk = "/customer-delete";
module.exports.updateUserStatus = "/customer-update-status/:customerId/:isActive";
module.exports.countUserStatus = "/analytics";
module.exports.addCustomerIntoCRM = "/addCustomerIntoCRM";
module.exports.updateCustomerIntoCRM = "/updateCustomerIntoCRM";
module.exports.addQuotationReq = "/addQuotationReq";
module.exports.updateQuotationReq = "/updateQuotationReq/:id/:status";
module.exports.getQuotationReqListByStatus = "/getQuotationReqListByStatus/:status/:type";
module.exports.getAllQuotationRequestsByStatus = "/getAllQuotationRequestsByStatus/:status";
module.exports.getQuotationRequestById = "/getQuotationRequestById/:id";
module.exports.getFilteredQuotationRequests = "/getQuotationRequests/:status";
module.exports.getProfileDetails = "/getProfileDetails";
module.exports.updateProfileDetails = "/updateProfileDetails";
module.exports.updateCompanyDetails = "/updateCompanyDetails";
module.exports.getQuotationByCustomerId = "/getQuotationByCustomerId/:id";
module.exports.getTotalTransactionForOrdersByCustomerId = "/getTotalTransactionForOrdersByCustomerId/:id/totalTransaction";
module.exports.getTotalTEUForOrdersByCustomerId = '/getTotalTEUForOrdersByCustomerId/:id/totalTEU';
module.exports.getTotalVolumeAmountForOrdersByCustomerId = '/getTotalVolumeAmountForOrdersByCustomerId/:id/totalVolume';
module.exports.getQuotationRequestCount = "/getQuotationRequestCount";
module.exports.getQuotationReqestCountByMonth = "/getQuotationReqestCountByMonth";

module.exports.createCustomerRequest = "/customer-request/create"
module.exports.getCustomerRequest = "/customer-request/details/:status"
module.exports.getCustomerRequestById = "/customer-request/:id"



module.exports.capacityPlanningBasePath = "/capacity-planning";
module.exports.capacityPlanningAllocationPath = "/allocation";
module.exports.capacityPlanningCustomerAllocationPath = "/allocation/:allocationId/customer";
module.exports.capacityPlanningAllCustomerAllocationPath = "/customer-allocation";
module.exports.capacityPlanningWeekwisePath = "/allocation/:allocationId/week";
module.exports.capacityPlanningAllocationReportExcelDownloadPath = "/allocation/download/excel";
module.exports.capacityPlanningAllocationReportExcelImportPath = "/allocation/import/excel";
module.exports.capacityPlanningAnalyticsSpaceUtilization = "/allocation/analytics/space-utilization";
module.exports.capacityPlanningAnalyticsCustomerWise = "/allocation/analytics/customer-wise";
module.exports.capacityPlanningAnalyticsPlanVsActualSummary = "/allocation/analytics/plan-vs-actual-summary";
module.exports.capacityPlanningAnalyticsPlanVsActual = "/allocation/analytics/plan-vs-actual";

// Schedule module endpoint
module.exports.scheduleBasePath = "/schedule";
module.exports.schedulePortsPath = "/ports";
module.exports.scheduleVesselsPath = "/vessels";
module.exports.scheduleCarriersPath = "/carriers";
module.exports.scheduleTripssPath = "/trips";
module.exports.scheduleCallsPath = "/calls";
module.exports.scheduleLocationsPath = "/locations";
module.exports.scheduleTrackingPath = "/tracking";
module.exports.scheduleSchedulesPath = "/schedules";
module.exports.searchSchedulesPath = "/search";
module.exports.getScheduleRoutePath = "/route";

// Documents
module.exports.documentsBasePath = "/documents";
module.exports.getRecordId = "/get-record-ids/:linkToModuleName";
module.exports.deleteDocument = "/delete/:id";


//Notifications
module.exports.notificationBasePath = "/notifications";
module.exports.updateNotification = "/update/:id";
module.exports.customerNotifications = "/customer";

//OnlinUsers
module.exports.onlineUsersBasePath="/insights";
module.exports.getOnlineUsers="/users/online";
module.exports.getUserSessions="/users/session";


//zoho
module.exports.zohoBasePath = "/zoho";
module.exports.getAndProcessQuotationRateExcel = "/quotation-rates/import/excel";
module.exports.startCroneJobs = "/start-crone-jobs";
module.exports.contractRateExpires = "/contractRateExpire";

//Track And Trace
module.exports.trackAndTraceBasePath = "/track-and-trace";
module.exports.trackAndTraceBillOfLoading = "/eta/container-bookmarks";

//invoices
module.exports.invoicesBasePath = "/invoices";
module.exports.createInvoice = "/create-invoices";
module.exports.fetchInvoices = "/fetchInvoice";
module.exports.getInvoicesById = "/getInvoicesById/:id";
module.exports.updateInvoceState = "/updateInvoiceState/:id/:status";
module.exports.getPdfInvoiceById = "/getPdfInvoiceById/:id";

//vessels
module.exports.vesselsBasePath = "/vessels";

//Voyages
module.exports.voyagesBasePath = "/voyages";
module.exports.getVoyageByVesselIdLoadingAndDestinationPortPath = "/:vesselId/:origin/:destination";

//bookings
module.exports.bookingsBasePath = "/bookings";
module.exports.bookingHaulagesPath = "/haulages";
module.exports.bookingContainersPath = "/containers";
module.exports.bookingCarriagePath = "/carriage";
module.exports.bookingPaymentDetails = "/payments";
module.exports.bookingNotification = "/notifications";
module.exports.bookingTemplate = "/template";
module.exports.getBookingData = "/getBookingList";
module.exports.getDataByPort = "/getDataByPort";
module.exports.getIndivisualBookingByPort = "/getIndivisualBookingByPort";
module.exports.getBookingDataById = "/:booking_id";
module.exports.bookingsInsurance = "/:bookingId/insurance";
module.exports.bookingStatus = "/status/:status";
module.exports.generatePdfById = "/generatePdfById/:booking_id";

// currency
module.exports.currencyBasePath = "/local-currencies";
module.exports.updateCurrencyData = "/updateCurrency/:id";
module.exports.getCurrencyData = "/currency";
module.exports.getCurrencyDataById = "/currencyById/:id";
