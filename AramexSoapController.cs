using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SpirithubcafeApi.Services.Aramex;
using SpirithubcafeApi.Services;
using SpirithubcafeApi.Models;
using System.ComponentModel.DataAnnotations;

namespace SpirithubcafeApi.WebApp.Controllers;

/// <summary>
/// Aramex SOAP API Controller - Direct integration with Aramex SOAP services
/// Provides low-level access to Aramex Rate Calculator, Location, Shipping, and Tracking APIs
/// </summary>
[ApiController]
[Route("api/aramex")]
[Authorize]
[IgnoreAntiforgeryToken]
public class AramexSoapController : ControllerBase
{
    private readonly AramexSoapClient _aramexClient;
    private readonly ILogger<AramexSoapController> _logger;
    private readonly IConfiguration _configuration;
    private readonly IOrderService _orderService;

    private const string DefaultPickupCurrencyCode = "OMR";

    public AramexSoapController(
        AramexSoapClient aramexClient,
        ILogger<AramexSoapController> logger,
        IConfiguration configuration,
        IOrderService orderService)
    {
        _aramexClient = aramexClient;
        _logger = logger;
        _configuration = configuration;
        _orderService = orderService;
    }

    private static string Safe(string? value) => value ?? string.Empty;

    private string GetPickupCurrencyCode()
    {
        // Prefer an explicit currency code if configured; otherwise fall back to a sensible default.
        return _configuration["Aramex:CurrencyCode"]
            ?? _configuration["Aramex:DefaultCurrencyCode"]
            ?? DefaultPickupCurrencyCode;
    }

    private (DateTime PickupDate, DateTime ReadyTime, DateTime LastPickupTime, DateTime ClosingTime) GetDefaultPickupTimes()
    {
        var now = DateTime.Now;

        var readyHour = _configuration.GetValue("Aramex:PickupReadyHour", 9);
        var lastPickupHour = _configuration.GetValue("Aramex:PickupLastHour", 17);
        var closingHour = _configuration.GetValue("Aramex:PickupClosingHour", 18);

        // If we are past last pickup time today, schedule for the next day.
        var pickupDate = now.Hour >= lastPickupHour ? now.Date.AddDays(1) : now.Date;

        var readyTime = pickupDate.AddHours(readyHour);
        var lastPickupTime = pickupDate.AddHours(lastPickupHour);
        var closingTime = pickupDate.AddHours(closingHour);

        return (pickupDate, readyTime, lastPickupTime, closingTime);
    }

    private async Task<(bool Success, bool HasWarnings, Services.Aramex.Shipping.ProcessedPickup? ProcessedPickup, List<string> Errors)>
        TryCreatePickupForShipmentAsync(
            Services.Aramex.Shipping.Shipment requestShipment,
            string shipmentNumber,
            string? transactionReference)
    {
        try
        {
            var shipperAddress = requestShipment.Shipper?.PartyAddress;
            var shipperContact = requestShipment.Shipper?.Contact;
            var details = requestShipment.Details;

            if (shipperAddress == null || shipperContact == null)
            {
                return (false, false, null, new List<string> { "Cannot create pickup: shipper address/contact missing" });
            }

            var (pickupDate, readyTime, lastPickupTime, closingTime) = GetDefaultPickupTimes();
            var currencyCode = GetPickupCurrencyCode();

            var packageType = _configuration["Aramex:PickupPackageType"] ?? "BOX";
            var vehicle = _configuration["Aramex:PickupVehicle"] ?? "CAR";
            var pickupLocation = _configuration["Aramex:PickupLocation"] ?? shipperAddress.Line1 ?? "Pickup";

            var weightUnit = details?.ActualWeight?.Unit ?? "KG";
            var weightValue = details?.ActualWeight?.Value ?? 1.0;
            var pieces = details?.NumberOfPieces ?? 1;

            var dimUnit = details?.Dimensions?.Unit ?? "CM";
            var dimLength = details?.Dimensions?.Length ?? 10.0;
            var dimWidth = details?.Dimensions?.Width ?? 10.0;
            var dimHeight = details?.Dimensions?.Height ?? 10.0;
            var volumeValue = dimLength * dimWidth * dimHeight;

            var pickup = new Services.Aramex.Shipping.Pickup
            {
                PickupAddress = new Services.Aramex.Shipping.Address
                {
                    Line1 = shipperAddress.Line1,
                    Line2 = Safe(shipperAddress.Line2),
                    Line3 = Safe(shipperAddress.Line3),
                    City = shipperAddress.City,
                    PostCode = Safe(shipperAddress.PostCode),
                    CountryCode = shipperAddress.CountryCode,
                    StateOrProvinceCode = shipperAddress.StateOrProvinceCode
                },
                PickupContact = new Services.Aramex.Shipping.Contact
                {
                    PersonName = shipperContact.PersonName,
                    CompanyName = shipperContact.CompanyName,
                    PhoneNumber1 = shipperContact.PhoneNumber1,
                    PhoneNumber2 = Safe(shipperContact.PhoneNumber2 ?? shipperContact.PhoneNumber1),
                    CellPhone = shipperContact.CellPhone,
                    EmailAddress = shipperContact.EmailAddress
                },
                PickupLocation = pickupLocation,
                PickupDate = pickupDate,
                ReadyTime = readyTime,
                LastPickupTime = lastPickupTime,
                ClosingTime = closingTime,
                Comments = $"Pickup for shipment {shipmentNumber}",
                Reference1 = transactionReference,
                Reference2 = shipmentNumber,
                Vehicle = vehicle,
                PickupItems = new[]
                {
                    new Services.Aramex.Shipping.PickupItemDetail
                    {
                        ProductGroup = details?.ProductGroup ?? "EXP",
                        ProductType = details?.ProductType ?? "PPX",
                        NumberOfShipments = 1,
                        PackageType = packageType,
                        Payment = details?.PaymentType ?? "P",
                        ShipmentWeight = new Services.Aramex.Shipping.Weight { Unit = weightUnit, Value = weightValue },
                        ShipmentVolume = new Services.Aramex.Shipping.Volume { Unit = $"{dimUnit}3", Value = volumeValue },
                        NumberOfPieces = pieces,
                        CashAmount = new Services.Aramex.Shipping.Money { CurrencyCode = currencyCode, Value = 0 },
                        ExtraCharges = new Services.Aramex.Shipping.Money { CurrencyCode = currencyCode, Value = 0 },
                        ShipmentDimensions = new Services.Aramex.Shipping.Dimensions
                        {
                            Length = dimLength,
                            Width = dimWidth,
                            Height = dimHeight,
                            Unit = dimUnit
                        },
                        Comments = string.Empty
                    }
                }
            };

            var tx = new Services.Aramex.Shipping.Transaction
            {
                Reference1 = string.IsNullOrWhiteSpace(transactionReference) ? "CreatePickup" : transactionReference
            };

            var response = await _aramexClient.CreatePickupAsync(pickup, tx);

            if (response.ProcessedPickup != null)
            {
                return (true, response.HasErrors, response.ProcessedPickup, new List<string>());
            }

            var errors = response.Notifications?.Select(n => $"[{n.Code}] {n.Message}").ToList()
                ?? new List<string> { "Pickup creation failed" };

            return (false, response.HasErrors, null, errors);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating pickup for shipment {ShipmentNumber}", shipmentNumber);
            return (false, false, null, new List<string> { ex.Message });
        }
    }

    #region Rate Calculator

    [HttpPost("calculate-rate")]
    [AllowAnonymous]
    public async Task<IActionResult> CalculateRate([FromBody] SimpleRateRequest request)
    {
        try
        {
            var originAddress = new Services.Aramex.RateCalculator.Address
            {
                Line1 = request.OriginAddress.Line1,
                City = request.OriginAddress.City,
                CountryCode = request.OriginAddress.CountryCode
            };

            var destinationAddress = new Services.Aramex.RateCalculator.Address
            {
                Line1 = request.DestinationAddress.Line1,
                City = request.DestinationAddress.City,
                CountryCode = request.DestinationAddress.CountryCode
            };

            var shipmentDetails = new Services.Aramex.RateCalculator.ShipmentDetails
            {
                ActualWeight = new Services.Aramex.RateCalculator.Weight
                {
                    Unit = request.ShipmentDetails.ActualWeight.Unit,
                    Value = request.ShipmentDetails.ActualWeight.Value
                },
                ChargeableWeight = new Services.Aramex.RateCalculator.Weight
                {
                    Unit = request.ShipmentDetails.ChargeableWeight?.Unit ?? request.ShipmentDetails.ActualWeight.Unit,
                    Value = request.ShipmentDetails.ChargeableWeight?.Value ?? request.ShipmentDetails.ActualWeight.Value
                },
                NumberOfPieces = request.ShipmentDetails.NumberOfPieces,
                ProductGroup = request.ShipmentDetails.ProductGroup,
                ProductType = request.ShipmentDetails.ProductType,
                PaymentType = request.ShipmentDetails.PaymentType,
                DescriptionOfGoods = request.ShipmentDetails.DescriptionOfGoods ?? "Goods"
            };

            if (request.ShipmentDetails.Dimensions != null)
            {
                shipmentDetails.Dimensions = new Services.Aramex.RateCalculator.Dimensions
                {
                    Length = request.ShipmentDetails.Dimensions.Length,
                    Width = request.ShipmentDetails.Dimensions.Width,
                    Height = request.ShipmentDetails.Dimensions.Height,
                    Unit = request.ShipmentDetails.Dimensions.Unit
                };
            }

            var response = await _aramexClient.CalculateRateAsync(originAddress, destinationAddress, shipmentDetails);

            if (!response.HasErrors && response.TotalAmount != null)
            {
                return Ok(new
                {
                    success = true,
                    totalAmount = new
                    {
                        value = response.TotalAmount.Value,
                        currencyCode = response.TotalAmount.CurrencyCode
                    }
                });
            }

            var errors = response.Notifications?.Select(n => n.Message).ToList() ?? new List<string> { "Unknown error" };
            _logger.LogWarning("Aramex rate calculation failed. Errors: {Errors}", string.Join(", ", errors));
            return BadRequest(new { success = false, errors });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating rate");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    #endregion

    #region Location

    [HttpGet("countries")]
    [AllowAnonymous]
    public async Task<IActionResult> FetchCountries()
    {
        try
        {
            var response = await _aramexClient.FetchCountriesAsync();

            if (!response.HasErrors && response.Countries != null)
            {
                return Ok(new
                {
                    success = true,
                    total = response.Countries.Length,
                    countries = response.Countries.Select(c => new { code = c.Code, name = c.Name }).ToList()
                });
            }

            var errors = response.Notifications?.Select(n => n.Message).ToList() ?? new List<string> { "Unknown error" };
            return BadRequest(new { success = false, errors });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching countries");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("cities/{countryCode}")]
    [AllowAnonymous]
    public async Task<IActionResult> FetchCities(string countryCode)
    {
        try
        {
            var response = await _aramexClient.FetchCitiesAsync(countryCode);

            if (!response.HasErrors && response.Cities != null)
            {
                return Ok(new
                {
                    success = true,
                    countryCode,
                    total = response.Cities.Length,
                    cities = response.Cities
                });
            }

            var errors = response.Notifications?.Select(n => n.Message).ToList() ?? new List<string> { "Unknown error" };
            return BadRequest(new { success = false, errors });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching cities");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("validate-address")]
    public async Task<IActionResult> ValidateAddress([FromBody] SimpleAddressRequest request)
    {
        try
        {
            var address = new Services.Aramex.Location.Address
            {
                Line1 = request.Address.Line1,
                City = request.Address.City,
                CountryCode = request.Address.CountryCode
            };

            var response = await _aramexClient.ValidateAddressAsync(address);

            return Ok(new
            {
                success = !response.HasErrors,
                isValid = !response.HasErrors,
                message = response.HasErrors ? "Validation failed" : "Address is valid"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating address");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    #endregion

    #region Shipping

    /// <summary>
    /// Create a pickup request in Aramex
    /// </summary>
    [HttpPost("create-pickup")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreatePickup([FromBody] CreatePickupRequestDto request)
    {
        try
        {
            if (request.PickupItems == null || request.PickupItems.Count == 0)
            {
                return BadRequest(new { success = false, errors = new List<string> { "At least one pickup item is required" } });
            }

            var pickup = new Services.Aramex.Shipping.Pickup
            {
                PickupAddress = new Services.Aramex.Shipping.Address
                {
                    Line1 = request.PickupAddress.Line1,
                    City = request.PickupAddress.City,
                    PostCode = request.PickupAddress.PostCode ?? string.Empty,
                    CountryCode = request.PickupAddress.CountryCode,
                    Line2 = request.PickupAddress.Line2 ?? string.Empty,
                    Line3 = request.PickupAddress.Line3 ?? string.Empty,
                    StateOrProvinceCode = request.PickupAddress.StateOrProvinceCode
                },
                PickupContact = new Services.Aramex.Shipping.Contact
                {
                    PersonName = request.PickupContact.PersonName,
                    CompanyName = request.PickupContact.CompanyName,
                    PhoneNumber1 = request.PickupContact.PhoneNumber1,
                    PhoneNumber2 = request.PickupContact.PhoneNumber2 ?? request.PickupContact.PhoneNumber1,
                    CellPhone = request.PickupContact.CellPhone ?? request.PickupContact.PhoneNumber1,
                    EmailAddress = request.PickupContact.EmailAddress
                },
                PickupDate = request.PickupDate,
                ReadyTime = request.ReadyTime,
                LastPickupTime = request.LastPickupTime,
                ClosingTime = request.ClosingTime ?? request.LastPickupTime,
                Comments = request.Comments,
                Reference1 = request.Reference1,
                Reference2 = request.Reference2,
                Vehicle = request.Vehicle,
                PickupLocation = request.PickupLocation,
                Status = request.Status,
                PickupItems = request.PickupItems.Select(i => new Services.Aramex.Shipping.PickupItemDetail
                {
                    ProductGroup = i.ProductGroup,
                    ProductType = i.ProductType,
                    NumberOfShipments = i.NumberOfShipments,
                    PackageType = i.PackageType,
                    Payment = i.Payment,
                    NumberOfPieces = i.NumberOfPieces,
                    ShipmentWeight = new Services.Aramex.Shipping.Weight
                    {
                        Unit = i.ShipmentWeight.Unit,
                        Value = i.ShipmentWeight.Value
                    },
                    ShipmentVolume = new Services.Aramex.Shipping.Volume
                    {
                        Unit = i.ShipmentVolume.Unit,
                        Value = i.ShipmentVolume.Value
                    },
                    CashAmount = new Services.Aramex.Shipping.Money
                    {
                        CurrencyCode = i.CashAmount.CurrencyCode,
                        Value = i.CashAmount.Value
                    },
                    ExtraCharges = new Services.Aramex.Shipping.Money
                    {
                        CurrencyCode = i.ExtraCharges.CurrencyCode,
                        Value = i.ExtraCharges.Value
                    },
                    ShipmentDimensions = new Services.Aramex.Shipping.Dimensions
                    {
                        Length = i.ShipmentDimensions.Length,
                        Width = i.ShipmentDimensions.Width,
                        Height = i.ShipmentDimensions.Height,
                        Unit = i.ShipmentDimensions.Unit
                    },
                    Comments = i.Comments
                }).ToArray()
            };

            var transaction = new Services.Aramex.Shipping.Transaction
            {
                Reference1 = request.TransactionReference ?? "CreatePickup"
            };

            var response = await _aramexClient.CreatePickupAsync(pickup, transaction);

            // Similar to shipment creation, Aramex may set HasErrors=true for warnings.
            // Treat as success if ProcessedPickup is present.
            if (response.ProcessedPickup != null)
            {
                return Ok(new
                {
                    success = true,
                    hasWarnings = response.HasErrors,
                    processedPickup = new
                    {
                        id = response.ProcessedPickup.ID,
                        guid = response.ProcessedPickup.GUID,
                        reference1 = response.ProcessedPickup.Reference1,
                        reference2 = response.ProcessedPickup.Reference2
                    },
                    notifications = response.Notifications?.Select(n => new { code = n.Code, message = n.Message }).ToList()
                });
            }

            var errors = response.Notifications?.Select(n => $"[{n.Code}] {n.Message}").ToList()
                ?? new List<string> { "Pickup creation failed" };
            return BadRequest(new { success = false, errors });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating pickup");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Cancel an Aramex pickup by GUID
    /// </summary>
    [HttpPost("cancel-pickup")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CancelPickup([FromBody] CancelPickupRequestDto request)
    {
        try
        {
            var response = await _aramexClient.CancelPickupAsync(request.PickupGUID, request.Comments ?? string.Empty);

            if (!response.HasErrors)
            {
                return Ok(new
                {
                    success = true,
                    message = response.Message,
                    notifications = response.Notifications?.Select(n => new { code = n.Code, message = n.Message }).ToList()
                });
            }

            var errors = response.Notifications?.Select(n => $"[{n.Code}] {n.Message}").ToList()
                ?? new List<string> { "Pickup cancelation failed" };

            return BadRequest(new
            {
                success = false,
                message = response.Message,
                errors
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error canceling pickup");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("create-shipment")]
    [AllowAnonymous]
    public async Task<IActionResult> CreateShipment([FromBody] SimpleShipmentRequest request)
    {
        try
        {
            // Get AccountNumber from config
            var accountNumber = _configuration["Aramex:AccountNumber"] ?? "71925275";
            
            var shipments = new[]
            {
                new Services.Aramex.Shipping.Shipment
                {
                    Shipper = new Services.Aramex.Shipping.Party
                    {
                        AccountNumber = accountNumber,
                        PartyAddress = new Services.Aramex.Shipping.Address
                        {
                            Line1 = request.Shipper.PartyAddress.Line1,
                            City = request.Shipper.PartyAddress.City,
                            PostCode = request.Shipper.PartyAddress.PostCode,
                            CountryCode = request.Shipper.PartyAddress.CountryCode
                        },
                        Contact = new Services.Aramex.Shipping.Contact
                        {
                            PersonName = request.Shipper.Contact.PersonName,
                            CompanyName = request.Shipper.Contact.CompanyName,
                            PhoneNumber1 = request.Shipper.Contact.PhoneNumber1,
                            CellPhone = request.Shipper.Contact.PhoneNumber1,
                            EmailAddress = request.Shipper.Contact.EmailAddress
                        }
                    },
                    Consignee = new Services.Aramex.Shipping.Party
                    {
                        PartyAddress = new Services.Aramex.Shipping.Address
                        {
                            Line1 = request.Consignee.PartyAddress.Line1,
                            City = request.Consignee.PartyAddress.City,
                            PostCode = request.Consignee.PartyAddress.PostCode,
                            CountryCode = request.Consignee.PartyAddress.CountryCode
                        },
                        Contact = new Services.Aramex.Shipping.Contact
                        {
                            PersonName = request.Consignee.Contact.PersonName,
                            CompanyName = request.Consignee.Contact.CompanyName,
                            PhoneNumber1 = request.Consignee.Contact.PhoneNumber1,
                            CellPhone = request.Consignee.Contact.PhoneNumber1,
                            EmailAddress = request.Consignee.Contact.EmailAddress
                        }
                    },
                    Details = new Services.Aramex.Shipping.ShipmentDetails
                    {
                        ProductGroup = request.Details.ProductGroup,
                        ProductType = request.Details.ProductType,
                        PaymentType = request.Details.PaymentType,
                        ActualWeight = new Services.Aramex.Shipping.Weight
                        {
                            Unit = request.Details.ActualWeight.Unit,
                            Value = request.Details.ActualWeight.Value
                        },
                        NumberOfPieces = request.Details.NumberOfPieces,
                        DescriptionOfGoods = request.Details.DescriptionOfGoods
                    }
                }
            };

            var transaction = new Services.Aramex.Shipping.Transaction { Reference1 = "WebOrder" };
            var response = await _aramexClient.CreateShipmentsAsync(transaction, shipments, "URL");

            // DEBUG: Log ALL shipment properties
            if (response.Shipments?.Length > 0)
            {
                var s = response.Shipments[0];
                _logger.LogWarning("DEBUG SHIPMENT: ID={ID}, Reference1={Ref1}, Reference2={Ref2}, ForeignHAWB={ForeignHAWB}, HasErrors={HasErrors}, SortCode={SortCode}", 
                    s.ID ?? "NULL", s.Reference1 ?? "NULL", s.Reference2 ?? "NULL", 
                    s.ForeignHAWB ?? "NULL", s.HasErrors, s.SortCode ?? "NULL");
                
                if (s.ShipmentDetails != null)
                {
                    _logger.LogWarning("DEBUG DETAILS: ActualShipmentDetails exists, checking Origin/Destination");
                }
                
                if (s.Notifications != null && s.Notifications.Length > 0)
                {
                    foreach (var n in s.Notifications)
                    {
                        _logger.LogWarning("DEBUG NOTIFICATION: Code={Code}, Message={Message}", n.Code ?? "NULL", n.Message ?? "NULL");
                    }
                }
            }
            else
            {
                _logger.LogWarning("DEBUG: No shipments in response array!");
            }

            // FIX: Check if shipment was created successfully (shipment.ID is the key indicator, not HasErrors)
            // Aramex API returns HasErrors=True even for warnings, so we must check if shipment.ID exists
            if (response.Shipments?.Length > 0 && !string.IsNullOrEmpty(response.Shipments[0].ID))
            {
                var shipment = response.Shipments[0];

                var pickupResult = await TryCreatePickupForShipmentAsync(
                    shipments[0],
                    shipment.ID,
                    transaction.Reference1);
                
                _logger.LogInformation("Shipment created successfully: ID={ID}, HasErrors={HasErrors}", 
                    shipment.ID, response.HasErrors);
                
                return Ok(new
                {
                    success = true,
                    shipmentNumber = shipment.ID,
                    awbNumber = shipment.ID,
                    trackingUrl = $"https://www.aramex.com/track/shipments?ShipmentNumber={shipment.ID}",
                    hasWarnings = response.HasErrors,
                    pickupSuccess = pickupResult.Success,
                    pickupHasWarnings = pickupResult.HasWarnings,
                    pickup = pickupResult.ProcessedPickup == null ? null : new
                    {
                        id = pickupResult.ProcessedPickup.ID,
                        guid = pickupResult.ProcessedPickup.GUID,
                        reference1 = pickupResult.ProcessedPickup.Reference1,
                        reference2 = pickupResult.ProcessedPickup.Reference2
                    },
                    pickupErrors = pickupResult.Errors
                });
            }

            _logger.LogWarning("Aramex CreateShipment failed. HasErrors: {HasErrors}, Notifications: {Notifications}", 
                response.HasErrors, 
                response.Notifications != null ? string.Join(", ", response.Notifications.Select(n => $"{n.Code}: {n.Message}")) : "NULL");

            var errors = response.Notifications?.Select(n => $"[{n.Code}] {n.Message}").ToList() ?? new List<string> { "Shipment creation failed - no shipment number returned" };
            return BadRequest(new { success = false, errors });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating shipment");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Create Aramex shipment for an existing order and save tracking number
    /// </summary>
    [HttpPost("create-shipment-for-order/{orderId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateShipmentForOrder(int orderId, [FromServices] SpirithubcafeApi.Services.IOrderService orderService)
    {
        try
        {
            // Get order
            var order = await orderService.GetOrderByIdAsync(orderId);
            if (order == null)
            {
                return NotFound(new { error = "Order not found" });
            }

            // Check if already has tracking number
            if (!string.IsNullOrEmpty(order.TrackingNumber))
            {
                return BadRequest(new { error = $"Order already has tracking number: {order.TrackingNumber}" });
            }

            // Get AccountNumber from config
            var accountNumber = _configuration["Aramex:AccountNumber"] ?? "71925275";
            
            // Create shipment from order data
            var shipments = new[]
            {
                new Services.Aramex.Shipping.Shipment
                {
                    Shipper = new Services.Aramex.Shipping.Party
                    {
                        AccountNumber = accountNumber,
                        PartyAddress = new Services.Aramex.Shipping.Address
                        {
                            Line1 = _configuration["Aramex:AddressLine1"] ?? "Spirit Hub Cafe",
                            City = _configuration["Aramex:City"] ?? "Muscat",
                            PostCode = _configuration["Aramex:PostalCode"] ?? "111",
                            CountryCode = _configuration["Aramex:CountryCode"] ?? "OM"
                        },
                        Contact = new Services.Aramex.Shipping.Contact
                        {
                            PersonName = _configuration["Aramex:ContactName"] ?? "Spirit Hub",
                            CompanyName = _configuration["Aramex:CompanyName"] ?? "Spirit Hub Cafe",
                            PhoneNumber1 = order.Phone ?? "+968 1234567",
                            CellPhone = order.Phone ?? "+968 1234567",
                            EmailAddress = _configuration["Aramex:Username"] ?? "info@spirithubcafe.com"
                        }
                    },
                    Consignee = new Services.Aramex.Shipping.Party
                    {
                        PartyAddress = new Services.Aramex.Shipping.Address
                        {
                            Line1 = order.IsGift ? (order.GiftRecipientAddress ?? order.Address) : order.Address,
                            City = order.IsGift ? (order.GiftRecipientCity ?? order.City) : order.City,
                            PostCode = order.IsGift ? (order.GiftRecipientPostalCode ?? order.PostalCode ?? "00000") : (order.PostalCode ?? "00000"),
                            CountryCode = order.IsGift ? (order.GiftRecipientCountry ?? order.Country) : order.Country
                        },
                        Contact = new Services.Aramex.Shipping.Contact
                        {
                            PersonName = order.IsGift ? (order.GiftRecipientName ?? order.FullName) : order.FullName,
                            CompanyName = order.IsGift ? (order.GiftRecipientName ?? order.FullName) : order.FullName,
                            PhoneNumber1 = order.IsGift ? (order.GiftRecipientPhone ?? order.Phone) : order.Phone,
                            CellPhone = order.IsGift ? (order.GiftRecipientPhone ?? order.Phone) : order.Phone,
                            EmailAddress = order.IsGift ? (order.GiftRecipientEmail ?? order.Email) : order.Email
                        }
                    },
                    Details = new Services.Aramex.Shipping.ShipmentDetails
                    {
                        ProductGroup = "EXP",
                        ProductType = "PPX",
                        PaymentType = "P",
                        ActualWeight = new Services.Aramex.Shipping.Weight
                        {
                            Unit = "KG",
                            Value = 2.0 // Default weight, should be calculated from order items
                        },
                        NumberOfPieces = order.Items?.Count ?? 1,
                        DescriptionOfGoods = $"Order {order.OrderNumber}"
                    }
                }
            };

            var transaction = new Services.Aramex.Shipping.Transaction { Reference1 = order.OrderNumber };
            var response = await _aramexClient.CreateShipmentsAsync(transaction, shipments, "URL");

            if (response.Shipments?.Length > 0 && !string.IsNullOrEmpty(response.Shipments[0].ID))
            {
                var shipment = response.Shipments[0];
                var trackingNumber = shipment.ID;

                var pickupResult = await TryCreatePickupForShipmentAsync(
                    shipments[0],
                    trackingNumber,
                    transaction.Reference1);
                
                // Update order with tracking number, pickup info and status
                var updateShippingResult = await orderService.UpdateShippingInfoAsync(order.Id, new OrderShippingUpdateDto
                {
                    ShippingMethodId = order.ShippingMethod,
                    TrackingNumber = trackingNumber,
                    ShippingCost = order.ShippingCost,
                    PickupGUID = pickupResult.ProcessedPickup?.GUID.ToString(),
                    PickupReference = pickupResult.ProcessedPickup?.ID
                });

                if (!updateShippingResult.Success)
                {
                    _logger.LogError("Failed to update tracking number for order {OrderNumber}: {Message}", 
                        order.OrderNumber, updateShippingResult.Message);
                    return BadRequest(new { success = false, error = $"Failed to update tracking number: {updateShippingResult.Message}" });
                }

                var updateStatusResult = await orderService.UpdateOrderStatusAsync(order.Id, "Shipped");
                if (!updateStatusResult.Success)
                {
                    _logger.LogError("Failed to update status for order {OrderNumber}: {Message}", 
                        order.OrderNumber, updateStatusResult.Message);
                    return BadRequest(new { success = false, error = $"Failed to update order status: {updateStatusResult.Message}" });
                }
                
                _logger.LogInformation("Shipment created for order {OrderNumber}: TrackingNumber={TrackingNumber}", 
                    order.OrderNumber, trackingNumber);
                
                return Ok(new
                {
                    success = true,
                    orderId = order.Id,
                    orderNumber = order.OrderNumber,
                    trackingNumber,
                    trackingUrl = $"https://www.aramex.com/track/shipments?ShipmentNumber={trackingNumber}",
                    hasWarnings = response.HasErrors,
                    pickupSuccess = pickupResult.Success,
                    pickupHasWarnings = pickupResult.HasWarnings,
                    pickup = pickupResult.ProcessedPickup == null ? null : new
                    {
                        id = pickupResult.ProcessedPickup.ID,
                        guid = pickupResult.ProcessedPickup.GUID,
                        reference1 = pickupResult.ProcessedPickup.Reference1,
                        reference2 = pickupResult.ProcessedPickup.Reference2
                    },
                    pickupErrors = pickupResult.Errors
                });
            }

            _logger.LogWarning("Failed to create shipment for order {OrderNumber}", order.OrderNumber);
            var errors = response.Notifications?.Select(n => $"[{n.Code}] {n.Message}").ToList() 
                ?? new List<string> { "Shipment creation failed - no shipment number returned" };
            return BadRequest(new { success = false, errors });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating shipment for order {OrderId}", orderId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    #endregion

    #region Tracking

    [HttpGet("track/{awbNumber}")]
    [AllowAnonymous]
    public async Task<IActionResult> TrackShipment(string awbNumber)
    {
        try
        {
            var response = await _aramexClient.TrackShipmentsAsync(new[] { awbNumber }, false);

            if (!response.HasErrors && response.TrackingResults != null && response.TrackingResults.Count > 0)
            {
                if (response.TrackingResults.TryGetValue(awbNumber, out var resultArray) && resultArray != null && resultArray.Length > 0)
                {
                    var latestResult = resultArray[resultArray.Length - 1];
                    return Ok(new
                    {
                        success = true,
                        awbNumber,
                        updateCode = latestResult.UpdateCode,
                        updateDescription = latestResult.UpdateDescription,
                        updateDateTime = latestResult.UpdateDateTime,
                        updateLocation = latestResult.UpdateLocation,
                        allUpdates = resultArray
                    });
                }
            }

            var errors = response.Notifications?.Select(n => n.Message).ToList() ?? new List<string> { "Shipment not found" };
            return NotFound(new { success = false, errors });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking shipment");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Print label for existing shipment
    /// </summary>
    /// <param name="shipmentNumber">Shipment/AWB number</param>
    /// <param name="productGroup">Product group (EXP for express, DOM for domestic)</param>
    /// <returns>Label URL</returns>
    [HttpPost("print-label")]
    [AllowAnonymous]
    public async Task<IActionResult> PrintLabel([FromBody] PrintLabelRequestDto request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.ShipmentNumber))
            {
                return BadRequest(new { success = false, error = "Shipment number is required" });
            }

            var productGroup = request.ProductGroup ?? "EXP";
            var response = await _aramexClient.PrintLabelAsync(request.ShipmentNumber, productGroup);

            if (!response.HasErrors && !string.IsNullOrEmpty(response.ShipmentLabel?.LabelURL))
            {
                return Ok(new
                {
                    success = true,
                    shipmentNumber = request.ShipmentNumber,
                    labelUrl = response.ShipmentLabel.LabelURL,
                    labelFileContents = response.ShipmentLabel.LabelFileContents
                });
            }

            var errors = response.Notifications?.Select(n => n.Message).ToList() ?? new List<string> { "Failed to print label" };
            return BadRequest(new { success = false, errors });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error printing label");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Download label PDF directly
    /// </summary>
    [HttpGet("print-label/{shipmentNumber}/download")]
    [AllowAnonymous]
    public async Task<IActionResult> DownloadLabel(string shipmentNumber, [FromQuery] string productGroup = "EXP")
    {
        try
        {
            var response = await _aramexClient.PrintLabelAsync(shipmentNumber, productGroup);

            if (!response.HasErrors && !string.IsNullOrEmpty(response.ShipmentLabel?.LabelURL))
            {
#pragma warning disable S6962 // HttpClient disposal is handled by using statement
                using var httpClient = new HttpClient();
#pragma warning restore S6962
                var pdfBytes = await httpClient.GetByteArrayAsync(response.ShipmentLabel.LabelURL);
                return File(pdfBytes, "application/pdf", $"aramex-label-{shipmentNumber}.pdf");
            }

            return NotFound(new { success = false, message = "Label not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading label");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    #endregion

    #region Admin - Create Shipment for Order

    /// <summary>
    /// Create Aramex shipment for an existing order and update tracking number
    /// </summary>
    /// <param name="request">Request containing order ID</param>
    /// <returns>Shipment details with tracking number</returns>
    [HttpPost("create-shipment-for-order")]
    [Authorize(Roles = "Admin")] 
    public async Task<IActionResult> CreateShipmentForOrder([FromBody] CreateShipmentForOrderRequest request)
    {
        try
        {
            // Get order details
            var order = await _orderService.GetOrderByIdAsync(request.OrderId);
            if (order == null)
            {
                return NotFound(new { success = false, error = $"Order {request.OrderId} not found" });
            }

            // Check if order already has tracking number
            if (!string.IsNullOrEmpty(order.TrackingNumber))
            {
                return BadRequest(new { success = false, error = $"Order already has tracking number: {order.TrackingNumber}" });
            }

            // Check if shipping method is Aramex (ShippingMethod = 3)
            if (order.ShippingMethod != 3)
            {
                return BadRequest(new { success = false, error = "Order shipping method is not Aramex" });
            }

            // Get AccountNumber from config
            var accountNumber = _configuration["Aramex:AccountNumber"] ?? "71925275";
            var shipperCompany = _configuration["Aramex:CompanyName"] ?? "Spirithub Cafe";
            var shipperPhone = _configuration["Aramex:PhoneNumber"] ?? "+96899123456";
            var shipperAddress = _configuration["Aramex:AddressLine1"] ?? "Muscat";
            var shipperCity = _configuration["Aramex:City"] ?? "Muscat";
            var shipperPostal = _configuration["Aramex:PostalCode"] ?? "111";
            var shipperCountry = _configuration["Aramex:CountryCode"] ?? "OM";

            // Determine recipient details (IsGift ? Gift recipient : Customer)
            var recipientName = order.IsGift && !string.IsNullOrEmpty(order.GiftRecipientName) 
                ? order.GiftRecipientName 
                : order.FullName;
            var recipientPhone = order.IsGift && !string.IsNullOrEmpty(order.GiftRecipientPhone) 
                ? order.GiftRecipientPhone 
                : order.Phone;
            var recipientAddress = order.IsGift && !string.IsNullOrEmpty(order.GiftRecipientAddress) 
                ? order.GiftRecipientAddress 
                : order.Address;
            var recipientCity = order.IsGift && !string.IsNullOrEmpty(order.GiftRecipientCity) 
                ? order.GiftRecipientCity 
                : order.City;
            var recipientCountry = order.IsGift && !string.IsNullOrEmpty(order.GiftRecipientCountry) 
                ? order.GiftRecipientCountry 
                : order.Country;
            var recipientPostal = order.IsGift && !string.IsNullOrEmpty(order.GiftRecipientPostalCode) 
                ? order.GiftRecipientPostalCode 
                : order.PostalCode ?? "";

            // Calculate total weight from order items (default 2.5 if not available)
            var totalWeight = 2.5; // Default weight
            var numberOfPieces = order.Items?.Count ?? 1;
            var descriptionOfGoods = $"Order {order.OrderNumber}";
            var customsValue = order.TotalAmount; // Use order total for customs

            var shipments = new[]
            {
                new Services.Aramex.Shipping.Shipment
                {
                    Shipper = new Services.Aramex.Shipping.Party
                    {
                        AccountNumber = accountNumber,
                        PartyAddress = new Services.Aramex.Shipping.Address
                        {
                            Line1 = shipperAddress,
                            City = shipperCity,
                            PostCode = shipperPostal,
                            CountryCode = shipperCountry
                        },
                        Contact = new Services.Aramex.Shipping.Contact
                        {
                            PersonName = shipperCompany,
                            CompanyName = shipperCompany,
                            PhoneNumber1 = shipperPhone,
                            CellPhone = shipperPhone,
                            EmailAddress = order.Email
                        }
                    },
                    Consignee = new Services.Aramex.Shipping.Party
                    {
                        PartyAddress = new Services.Aramex.Shipping.Address
                        {
                            Line1 = recipientAddress,
                            City = recipientCity,
                            PostCode = recipientPostal,
                            CountryCode = recipientCountry
                        },
                        Contact = new Services.Aramex.Shipping.Contact
                        {
                            PersonName = recipientName,
                            CompanyName = recipientName,
                            PhoneNumber1 = recipientPhone,
                            CellPhone = recipientPhone,
                            EmailAddress = order.Email
                        }
                    },
                    Details = new Services.Aramex.Shipping.ShipmentDetails
                    {
                        ProductGroup = "EXP",
                        ProductType = "PPX",
                        PaymentType = "P",
                        ActualWeight = new Services.Aramex.Shipping.Weight
                        {
                            Unit = "KG",
                            Value = totalWeight
                        },
                        NumberOfPieces = numberOfPieces,
                        DescriptionOfGoods = descriptionOfGoods,
                        CustomsValueAmount = new Services.Aramex.Shipping.Money
                        {
                            CurrencyCode = "OMR",
                            Value = (double)customsValue
                        }
                    }
                }
            };

            var transaction = new Services.Aramex.Shipping.Transaction { Reference1 = order.OrderNumber };
            var response = await _aramexClient.CreateShipmentsAsync(transaction, shipments, "URL");

            // Log detailed response
            _logger.LogWarning("DEBUG - Order {OrderId} Aramex Response: HasErrors={HasErrors}, Shipments Count={Count}", 
                order.Id, response.HasErrors, response.Shipments?.Length ?? 0);
            
            if (response.Shipments?.Length > 0)
            {
                var s = response.Shipments[0];
                _logger.LogWarning("DEBUG - Shipment[0]: ID={ID}, HasErrors={HasErrors}, Notifications Count={NotifCount}", 
                    s.ID, s.HasErrors, s.Notifications?.Length ?? 0);
                
                if (s.Notifications != null)
                {
                    foreach (var n in s.Notifications)
                    {
                        _logger.LogWarning("DEBUG - Notification: Code={Code}, Message={Message}", n.Code, n.Message);
                    }
                }
            }

            if (response.Shipments?.Length > 0 && !string.IsNullOrEmpty(response.Shipments[0].ID))
            {
                var shipment = response.Shipments[0];
                var trackingNumber = shipment.ID;

                var pickupResult = await TryCreatePickupForShipmentAsync(
                    shipments[0],
                    trackingNumber,
                    transaction.Reference1);
                
                _logger.LogInformation("Shipment created for Order {OrderId}: TrackingNumber={TrackingNumber}", 
                    order.Id, trackingNumber);

                // Update order with tracking number and pickup information
                var updateResult = await _orderService.UpdateShippingInfoAsync(order.Id, new OrderShippingUpdateDto 
                { 
                    ShippingMethodId = order.ShippingMethod,
                    TrackingNumber = trackingNumber,
                    PickupGUID = pickupResult.ProcessedPickup?.GUID.ToString(),
                    PickupReference = pickupResult.ProcessedPickup?.ID
                });

                if (!updateResult.Success)
                {
                    _logger.LogWarning("Failed to update order {OrderId} with tracking number: {Message}", 
                        order.Id, updateResult.Message);
                }
                
                return Ok(new
                {
                    success = true,
                    orderId = order.Id,
                    orderNumber = order.OrderNumber,
                    shipmentNumber = trackingNumber,
                    awbNumber = trackingNumber,
                    trackingUrl = $"https://www.aramex.com/track/shipments?ShipmentNumber={trackingNumber}",
                    hasWarnings = response.HasErrors,
                    pickupSuccess = pickupResult.Success,
                    pickupHasWarnings = pickupResult.HasWarnings,
                    pickup = pickupResult.ProcessedPickup == null ? null : new
                    {
                        id = pickupResult.ProcessedPickup.ID,
                        guid = pickupResult.ProcessedPickup.GUID,
                        reference1 = pickupResult.ProcessedPickup.Reference1,
                        reference2 = pickupResult.ProcessedPickup.Reference2
                    },
                    pickupErrors = pickupResult.Errors
                });
            }

            // Collect all error messages from shipment notifications
            var errors = new List<string>();
            if (response.Shipments?.Length > 0 && response.Shipments[0].Notifications != null)
            {
                errors.AddRange(response.Shipments[0].Notifications.Select(n => $"[{n.Code}] {n.Message}"));
            }
            
            if (errors.Count == 0)
            {
                errors.Add("Shipment creation failed - no shipment number returned and no error details from Aramex");
            }
            
            _logger.LogError("Failed to create shipment for Order {OrderId}: {Errors}", 
                order.Id, string.Join("; ", errors));
            
            return BadRequest(new { success = false, errors });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating shipment for order {OrderId}", request.OrderId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    #endregion
}

#region Request DTOs

public class SimpleRateRequest
{
    [Required] public SimpleAddress OriginAddress { get; set; } = null!;
    [Required] public SimpleAddress DestinationAddress { get; set; } = null!;
    [Required] public SimpleShipmentDetails ShipmentDetails { get; set; } = null!;
}

public class SimpleAddress
{
    [Required] public string Line1 { get; set; } = null!;
    [Required] public string City { get; set; } = null!;
    [Required] public string CountryCode { get; set; } = null!;
    public string? PostCode { get; set; }
}

public class SimpleShipmentDetails
{
    [Required] public required SimpleWeight ActualWeight { get; set; }
    public SimpleWeight? ChargeableWeight { get; set; }
    [Required] public required int NumberOfPieces { get; set; }
    [Required] public required string ProductGroup { get; set; }
    [Required] public required string ProductType { get; set; }
    [Required] public required string PaymentType { get; set; }
    public string? DescriptionOfGoods { get; set; }
    public SimpleDimensions? Dimensions { get; set; }
}

public class SimpleWeight
{
    [Required] public required string Unit { get; set; }
    [Required] public required double Value { get; set; }
}

public class SimpleDimensions
{
    [Required] public required double Length { get; set; }
    [Required] public required double Width { get; set; }
    [Required] public required double Height { get; set; }
    [Required] public required string Unit { get; set; }
}

public class SimpleAddressRequest
{
    [Required] public SimpleAddress Address { get; set; } = null!;
}

public class SimpleShipmentRequest
{
    [Required] public SimpleParty Shipper { get; set; } = null!;
    [Required] public SimpleParty Consignee { get; set; } = null!;
    [Required] public SimpleShipmentDetails Details { get; set; } = null!;
}

public class SimpleParty
{
    [Required] public SimpleAddress PartyAddress { get; set; } = null!;
    [Required] public SimpleContact Contact { get; set; } = null!;
}

public class SimpleContact
{
    [Required] public string PersonName { get; set; } = null!;
    [Required] public string CompanyName { get; set; } = null!;
    [Required] public string PhoneNumber1 { get; set; } = null!;
    [Required] public string EmailAddress { get; set; } = null!;
}

public class PrintLabelRequestDto
{
    [Required] public string ShipmentNumber { get; set; } = null!;
    public string? ProductGroup { get; set; } = "EXP";
}

public class CreateShipmentForOrderRequest
{
    [Required]
    [System.Text.Json.Serialization.JsonRequired]
    public int OrderId { get; set; }
}

public class CreatePickupRequestDto
{
    [Required] public SimplePickupAddress PickupAddress { get; set; } = null!;
    [Required] public SimplePickupContact PickupContact { get; set; } = null!;

    public required DateTime PickupDate { get; set; }
    public required DateTime ReadyTime { get; set; }
    public required DateTime LastPickupTime { get; set; }
    public DateTime? ClosingTime { get; set; }

    [Required] public string PickupLocation { get; set; } = null!;
    [Required] public string Vehicle { get; set; } = null!;

    public string? Status { get; set; }
    public string? Comments { get; set; }
    public string? Reference1 { get; set; }
    public string? Reference2 { get; set; }
    public string? TransactionReference { get; set; }

    [Required]
    [MinLength(1)]
    public List<SimplePickupItemDetail> PickupItems { get; set; } = new();
}

public class CancelPickupRequestDto
{
    [Required] public string PickupGUID { get; set; } = null!;
    public string? Comments { get; set; }
}

public class SimplePickupAddress
{
    [Required] public string Line1 { get; set; } = null!;
    public string? Line2 { get; set; }
    public string? Line3 { get; set; }
    [Required] public string City { get; set; } = null!;
    [Required] public string CountryCode { get; set; } = null!;
    public string? PostCode { get; set; }
    public string? StateOrProvinceCode { get; set; }
}

public class SimplePickupContact
{
    [Required] public string PersonName { get; set; } = null!;
    public string? CompanyName { get; set; }
    [Required] public string PhoneNumber1 { get; set; } = null!;
    public string? PhoneNumber2 { get; set; }
    public string? CellPhone { get; set; }
    public string? EmailAddress { get; set; }
}

public class SimplePickupItemDetail
{
    [Required] public string ProductGroup { get; set; } = null!;
    [Required] public string ProductType { get; set; } = null!;
    [Required] public int NumberOfShipments { get; set; }
    [Required] public string PackageType { get; set; } = null!;
    [Required] public string Payment { get; set; } = null!;
    [Required] public int NumberOfPieces { get; set; }

    [Required] public SimpleWeight ShipmentWeight { get; set; } = null!;
    [Required] public SimpleVolume ShipmentVolume { get; set; } = null!;
    [Required] public SimpleMoney CashAmount { get; set; } = null!;
    [Required] public SimpleMoney ExtraCharges { get; set; } = null!;
    [Required] public SimpleDimensions ShipmentDimensions { get; set; } = null!;

    [Required] public string Comments { get; set; } = string.Empty;
}

public class SimpleVolume
{
    [Required] public required string Unit { get; set; }
    [Required] public required double Value { get; set; }
}

public class SimpleMoney
{
    [Required] public required string CurrencyCode { get; set; }
    [Required] public required double Value { get; set; }
}

#endregion
