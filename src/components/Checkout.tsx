import { useState, useEffect, FormEvent } from "react";
import { 
  ArrowLeft, 
  CreditCard, 
  Landmark, 
  Truck, 
  HelpCircle, 
  ArrowRight, 
  Loader2, 
  Minus, 
  Plus, 
  Trash2, 
  User, 
  Phone, 
  MapPin, 
  Building, 
  Edit, 
  PlusCircle, 
  Check, 
  X, 
  FileText,
  Home
} from "lucide-react";
import { CartItem, SiteSettings, Coupon, is3DProduct } from "../types";
import { motion } from "motion/react";

interface AddressItem {
  id: string;
  dept: string;
  zone: string;
  street: string;
  doorNumber: string;
  apartment?: string;
  solar?: string;
  manzana?: string;
}

const DEPT_ZONES: Record<string, string[]> = {
  Montevideo: [
    "Paso de la Arena",
    "Pocitos",
    "Buceo",
    "Malvín",
    "Centro",
    "Cordón",
    "Tres Cruces",
    "Parque Rodó",
    "La Teja",
    "Cerro",
    "Unión",
    "Colón",
    "Prado",
    "Carrasco",
    "Aguada",
    "Punta Carretas"
  ],
  Canelones: [
    "Aguas Corrientes",
    "Araminda",
    "Atlántida",
    "Balneario Argentino",
    "Barros Blancos",
    "Bello Horizonte",
    "Canelones (Capital)",
    "Cerrillos",
    "Ciudad de la Costa",
    "Colinas de Solymar",
    "Colonia Nicolich",
    "Costa Azul",
    "Cuchilla Alta",
    "El Fortín",
    "El Pinar",
    "Empalme Olmos",
    "Estación Atlántida",
    "Guazuvirá",
    "Jaureguiberry",
    "Joaquín Suárez",
    "La Floresta",
    "La Paz",
    "Lagomar",
    "Las Piedras",
    "Las Toscas",
    "Lomas de Solymar",
    "Marindia",
    "Migues",
    "Montes",
    "Neptunia",
    "Pando",
    "Parque de Solymar",
    "Parque del Plata",
    "Paso Carrasco",
    "Pinamar",
    "Progreso",
    "Salinas",
    "San Jacinto",
    "San José de Carrasco",
    "San Luis",
    "San Ramón",
    "Santa Lucía",
    "Santa Rosa",
    "Sauce",
    "Shangrilá",
    "Soca",
    "Solymar",
    "Tala",
    "Toledo",
    "Villa Aeroparque"
  ],
  Maldonado: [
    "Maldonado Centro",
    "Punta del Este",
    "Piriápolis",
    "San Carlos",
    "José Ignacio",
    "Manantiales",
    "Pinares",
    "Aiguá",
    "Pan de Azúcar"
  ],
  "San José": [
    "San José de Mayo",
    "Ciudad del Plata",
    "Libertad",
    "Ecilda Paullier",
    "Rodríguez"
  ],
  Colonia: [
    "Colonia del Sacramento",
    "Carmelo",
    "Nueva Helvecia",
    "Juan Lacaze",
    "Rosario",
    "Tarariras",
    "Nueva Palmira"
  ]
};

interface CheckoutProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  onRemoveItem: (productId: string, size?: string, color?: string) => void;
  settings: SiteSettings;
  onClearCart: () => void;
  onBackToCatalog: () => void;
  coupons?: Coupon[];
}

export default function Checkout({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  settings,
  onClearCart,
  onBackToCatalog,
  coupons
}: CheckoutProps) {
  // Client details states (Clean/empty on start as requested)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [rutNumber, setRutNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [fiscalAddress, setFiscalAddress] = useState("");

  // Validation States for real-time error handling
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Uruguayan RUT Checksum Validation (Module 11)
  const validateRUTUruguay = (rut: string): boolean => {
    const cleanRut = rut.replace(/\D/g, "");
    if (cleanRut.length !== 12) return false;
    
    // First two digits represent department code 01-21 in Uruguay
    const dptoCode = parseInt(cleanRut.substring(0, 2), 10);
    if (dptoCode < 1 || dptoCode > 21) return false;
    
    // Verify branch suffix is valid (usually non-zero)
    const branch = parseInt(cleanRut.substring(8, 11), 10);
    if (branch < 1) return false;
    
    // Checksum Weights: 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2
    const weights = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += parseInt(cleanRut.charAt(i), 10) * weights[i];
    }
    const mod = sum % 11;
    const digitoVerificadorCalculado = mod === 0 ? 0 : 11 - mod;
    const digitoVerificadorReal = parseInt(cleanRut.charAt(11), 10);
    
    if (digitoVerificadorCalculado === 10) {
      return false;
    }
    return digitoVerificadorCalculado === digitoVerificadorReal;
  };

  const validateField = (fieldName: string, value: string, currentWantsInvoice?: boolean): string => {
    const activeWantsInvoice = currentWantsInvoice !== undefined ? currentWantsInvoice : wantsInvoice;
    const sanitize = (val: string) => {
      return val.replace(/<[^>]*>/g, "").trim();
    };

    switch (fieldName) {
      case "firstName": {
        const clean = sanitize(value);
        if (!clean) return "El nombre es obligatorio.";
        if (clean.length < 2) return "El nombre debe tener un mínimo de 2 caracteres.";
        const lettersOnly = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\'\.]+(\s[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\'\.]+)*$/;
        if (!lettersOnly.test(clean)) {
          return "El nombre sólo debe contener letras, espacios y caracteres acentuados.";
        }
        return "";
      }
      case "lastName": {
        const clean = sanitize(value);
        if (!clean) return "El apellido es obligatorio.";
        if (clean.length < 2) return "El apellido debe tener un mínimo de 2 caracteres.";
        const lettersOnly = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\'\.]+(\s[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\'\.]+)*$/;
        if (!lettersOnly.test(clean)) {
          return "El apellido sólo debe contener letras, espacios y caracteres acentuados.";
        }
        return "";
      }
      case "phone": {
        const cleanVal = value.trim();
        if (!cleanVal) return "El teléfono de contacto es obligatorio.";
        
        // Solo permitir números, espacios, guiones y el prefijo +
        const allowedChars = /^[0-9\s\-+]+$/;
        if (!allowedChars.test(cleanVal)) {
          return "Solo se permiten números, espacios, guiones y el prefijo +.";
        }

        const digitsOnly = cleanVal.replace(/\D/g, "");
        if (digitsOnly.length < 8) return "El teléfono debe tener un mínimo de 8 dígitos.";

        // Validar formato de teléfono uruguayo
        let isUruguayFormat = false;
        if (digitsOnly.startsWith("598")) {
          const rest = digitsOnly.slice(3);
          if (/^(0?9|2|4)/.test(rest) && rest.length >= 7) {
            isUruguayFormat = true;
          }
        } else {
          if (/^(0?9|2|4)/.test(digitsOnly)) {
            isUruguayFormat = true;
          }
        }

        if (!isUruguayFormat) {
          return "El formato debe ser un teléfono uruguayo válido (ej: 099123456 o 24001234).";
        }
        return "";
      }
      case "rutNumber": {
        if (!activeWantsInvoice) return "";
        const cleanVal = value.replace(/\D/g, "");
        if (!value.trim()) return "El RUT es obligatorio.";
        if (cleanVal.length !== 12) return "El RUT debe tener exactamente 12 dígitos.";

        const isValidRut = validateRUTUruguay(cleanVal);
        if (!isValidRut) {
          return "El RUT ingresado no es válido para Uruguay (dígito verificador incorrecto).";
        }
        return "";
      }
      case "companyName": {
        if (!activeWantsInvoice) return "";
        const clean = sanitize(value);
        if (!clean) return "La Razón Social es obligatoria.";
        if (clean.length < 2) return "La Razón Social debe tener un mínimo de 2 caracteres.";
        return "";
      }
      case "fiscalAddress": {
        if (!activeWantsInvoice) return "";
        const clean = sanitize(value);
        if (!clean) return "La Dirección Fiscal es obligatoria.";
        if (clean.length < 3) return "La Dirección Fiscal debe tener un mínimo de 3 caracteres.";
        return "";
      }
      default:
        return "";
    }
  };

  const handleFieldChange = (name: string, val: string) => {
    // Basic tag-cleaning sanitization
    const sanitizedVal = val.replace(/<[^>]*>/g, "");
    
    if (name === "firstName") setFirstName(sanitizedVal);
    else if (name === "lastName") setLastName(sanitizedVal);
    else if (name === "phone") setPhone(sanitizedVal);
    else if (name === "rutNumber") setRutNumber(sanitizedVal);
    else if (name === "companyName") setCompanyName(sanitizedVal);
    else if (name === "fiscalAddress") setFiscalAddress(sanitizedVal);

    setTouchedFields(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, sanitizedVal);
    setValidationErrors(prev => ({ ...prev, [name]: err }));
  };

  const hasPickup = settings.pickupActive !== false;
  const hasDelivery = settings.deliveryActive !== false;

  // Delivery options states
  const [shippingType, setShippingType] = useState<"pickup" | "delivery">(
    hasDelivery ? "delivery" : "pickup"
  );
  
  // Structured physical address states for Uruguay
  const [dept, setDept] = useState("Montevideo");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [doorNumber, setDoorNumber] = useState("");
  const [apartment, setApartment] = useState("");
  const [solar, setSolar] = useState("");
  const [manzana, setManzana] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [deliveryPreference, setDeliveryPreference] = useState<"home" | "agency">("home");
  const [shippingNotes, setShippingNotes] = useState("");

  // Delivery carrier selection state
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<string>("");

  useEffect(() => {
    if (!hasDelivery && hasPickup) {
      setShippingType("pickup");
    } else if (!hasPickup && hasDelivery) {
      setShippingType("delivery");
    }
  }, [settings.pickupActive, settings.deliveryActive]);

  const deliveryMethods = settings.deliveryMethods || [
    {
      id: "express_mvd",
      title: "Envío Express en 3 horas dentro de Montevideo (ver zonas)",
      subtext: "*antes de 16h de L a V",
      iconType: "motorcycle"
    },
    {
      id: "mvd_normal",
      title: "Envío dentro de Montevideo (24 a 48 horas)",
      subtext: null,
      iconType: "truck_orange"
    },
    {
      id: "ues",
      title: "Envío a todo el país por UES",
      subtext: null,
      iconType: "ues"
    },
    {
      id: "dac",
      title: "Envío a todo el país por DAC (Agencia Central)",
      subtext: null,
      iconType: "dac"
    },
    {
      id: "depunta",
      title: "Envío a Maldonado por De Punta",
      subtext: null,
      iconType: "depunta"
    }
  ];

  useEffect(() => {
    if (deliveryMethods.length > 0 && !selectedDeliveryMethod) {
      setSelectedDeliveryMethod(deliveryMethods[0].id);
    }
  }, [settings.deliveryMethods, selectedDeliveryMethod]);

  // Stored Addresses (empty by default as requested by the user)
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  // Address Modal editing state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [modalDept, setModalDept] = useState("Montevideo");
  const [modalZone, setModalZone] = useState("Paso de la Arena");
  const [modalStreet, setModalStreet] = useState("");
  const [modalDoorNumber, setModalDoorNumber] = useState("");
  const [modalApartment, setModalApartment] = useState("");
  const [modalSolar, setModalSolar] = useState("");
  const [modalManzana, setModalManzana] = useState("");
  const [modalError, setModalError] = useState("");

  // Synchronize active address state fields with the selected list item
  useEffect(() => {
    const activeAddress = addresses.find((a) => a.id === selectedAddressId);
    if (activeAddress) {
      setDept(activeAddress.dept);
      setCity(activeAddress.dept);
      setStreet(activeAddress.street);
      setDoorNumber(activeAddress.doorNumber);
      setApartment(activeAddress.apartment || "");
      setSolar(activeAddress.solar || "");
      setManzana(activeAddress.manzana || "");
      setNeighborhood(activeAddress.zone);
    }
  }, [selectedAddressId, addresses]);

  // Sync carrier default department if carrier requires it
  useEffect(() => {
    if (selectedDeliveryMethod === "express_mvd" || selectedDeliveryMethod === "mvd_normal") {
      // Just check if active address is in Montevideo. If not, auto-select a compatible address if exists
      const fallbackMvd = addresses.find(a => a.dept === "Montevideo");
      if (fallbackMvd && dept !== "Montevideo") {
        setSelectedAddressId(fallbackMvd.id);
      }
    } else if (selectedDeliveryMethod === "depunta") {
      const fallbackMaldonado = addresses.find(a => a.dept === "Maldonado");
      if (fallbackMaldonado && dept !== "Maldonado") {
        setSelectedAddressId(fallbackMaldonado.id);
      }
    }
  }, [selectedDeliveryMethod]);

  // Payment methods states & effects
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [checkoutStep, setCheckoutStep] = useState<"details" | "payment">("details");

  useEffect(() => {
    if (settings.mercadopagoActive !== false) {
      setPaymentMethod("mercadopago");
    } else if (settings.transferActive !== false) {
      setPaymentMethod("transfer");
    } else if (settings.cashActive !== false) {
      setPaymentMethod("cash");
    } else {
      setPaymentMethod("coordinating");
    }
  }, [settings]);

  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0); // in percentage
  const [promoStatus, setPromoStatus] = useState<"none" | "success" | "invalid">("none");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Calculate prices
  const getItemPrice = (item: CartItem): number => {
    const p = item.product;
    if (p.variants && p.variants.length > 0 && item.selectedSize) {
      const exactMatch = item.selectedColor 
        ? p.variants.find(v => v.size === item.selectedSize && v.color === item.selectedColor)
        : null;
      const sizeMatch = p.variants.find(v => v.size === item.selectedSize);
      const match = exactMatch || sizeMatch;
      if (match && match.price !== undefined) {
        return match.price;
      }
    }
    return p.price;
  };

  const subtotalUYU = cartItems.reduce((acc, item) => acc + getItemPrice(item) * item.quantity, 0);
  const discountAmountUYU = Math.round((subtotalUYU * appliedDiscount) / 100);
  const totalUYU = Math.max(0, subtotalUYU - discountAmountUYU);

  // Check if current delivery matches free shipping guidelines
  const checkIfFreeShipping = (): boolean => {
    if (settings.freeShippingActive === false) return false;
    if (shippingType !== "delivery") return false;

    const minAmount = settings.freeShippingMinAmount !== undefined ? settings.freeShippingMinAmount : 2000;
    if (subtotalUYU < minAmount) return false;

    const regionsStr = settings.freeShippingRegions || "Pinamar, Salinas, Marindia, Neptunia";
    const regions = regionsStr
      .split(",")
      .map(r => r.trim().toLowerCase())
      .filter(Boolean);

    if (regions.length === 0) return true;

    const activeZone = (neighborhood || "").trim().toLowerCase();
    return regions.includes(activeZone);
  };

  const hasFreeShipping = checkIfFreeShipping();

  const exchangeRate = parseFloat(settings.exchangeRate as any) || 40;
  const totalUSD = totalUYU / exchangeRate;

  const handleApplyPromo = () => {
    if (!promoCode) {
      setPromoStatus("none");
      setAppliedDiscount(0);
      return;
    }
    const cleanPromo = promoCode.trim().toUpperCase();

    const matchedCoupon = coupons?.find(
      (c) => c.code.toUpperCase() === cleanPromo && c.active !== false
    );

    if (matchedCoupon) {
      let isExpired = false;
      if (matchedCoupon.expiration_date) {
        const expiration = new Date(matchedCoupon.expiration_date);
        if (expiration.getTime() < Date.now()) {
          isExpired = true;
        }
      }

      if (!isExpired) {
        setAppliedDiscount(matchedCoupon.discount_percent);
        setPromoStatus("success");
        setErrorMessage("");
        return;
      }
    }

    if (cleanPromo === "APEX50" || cleanPromo === "DESCUENTO10" || cleanPromo === "PROMO" || cleanPromo === "OFFER") {
      setAppliedDiscount(10);
      setPromoStatus("success");
      setErrorMessage("");
    } else {
      setAppliedDiscount(0);
      setPromoStatus("invalid");
    }
  };

  const validateDetails = (): boolean => {
    setErrorMessage("");

    const activeFields = ["firstName", "lastName", "phone"];
    if (wantsInvoice) {
      activeFields.push("rutNumber", "companyName", "fiscalAddress");
    }

    const currentErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};
    let hasValidationError = false;

    activeFields.forEach((field) => {
      newTouched[field] = true;
      let val = "";
      if (field === "firstName") val = firstName;
      else if (field === "lastName") val = lastName;
      else if (field === "phone") val = phone;
      else if (field === "rutNumber") val = rutNumber;
      else if (field === "companyName") val = companyName;
      else if (field === "fiscalAddress") val = fiscalAddress;

      const err = validateField(field, val);
      if (err) {
        currentErrors[field] = err;
        hasValidationError = true;
      } else {
        currentErrors[field] = "";
      }
    });

    setTouchedFields(prev => ({ ...prev, ...newTouched }));
    setValidationErrors(prev => ({ ...prev, ...currentErrors }));

    if (hasValidationError) {
      setErrorMessage("Por favor corrige los campos inválidos marcados en rojo en el formulario.");
      return false;
    }

    if (shippingType === "delivery") {
      const activeAddress = addresses.find((a) => a.id === selectedAddressId);
      if (!activeAddress) {
        setErrorMessage("Por favor agrega y selecciona una dirección de envío obligatoria.");
        return false;
      }

      if (!selectedDeliveryMethod) {
        setErrorMessage("Por favor selecciona una forma de envío a domicilio.");
        return false;
      }

      const isMontevideo = dept === "Montevideo";

      if (isMontevideo) {
        if (!street.trim()) {
          setErrorMessage("Por favor ingresa la calle de entrega.");
          return false;
        }
        if (deliveryPreference === "home" && !doorNumber.trim()) {
          setErrorMessage("Por favor ingresa el número de puerta.");
          return false;
        }
        if (!neighborhood.trim()) {
          setErrorMessage("Por favor ingresa tu barrio de Montevideo.");
          return false;
        }
      } else {
        // Outside Montevideo: either street (and optional door/solar/manzana) OR solar & manzana
        const hasStreet = !!street.trim();
        const hasDoor = !!doorNumber.trim();
        const hasSolarManzana = !!solar.trim() && !!manzana.trim();

        if (!hasStreet && !hasSolarManzana) {
          setErrorMessage("Por favor ingresa la calle o, en su defecto, la Manzana y Solar de entrega.");
          return false;
        }
        if (deliveryPreference === "home" && !hasDoor && !hasSolarManzana) {
          setErrorMessage("Por favor ingresa el número de puerta, o la Manzana y el Solar de entrega.");
          return false;
        }
      }

      if (!city.trim()) {
        setErrorMessage("Por favor ingresa la localidad o ciudad.");
        return false;
      }
    }
    return true;
  };

  const handleContinueToPayment = () => {
    if (validateDetails()) {
      setCheckoutStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateDetails()) {
      return;
    }

    let finalShippingAddress = "Retiro en Local de la Empresa (Av. Italia 3824, Montevideo)";
    let deliveryCarrierInfo = "";

    if (shippingType === "delivery") {
      const activeAddress = addresses.find((a) => a.id === selectedAddressId);
      if (!activeAddress) {
        setErrorMessage("Por favor agrega y selecciona una dirección de envío obligatoria.");
        return;
      }

      if (!selectedDeliveryMethod) {
        setErrorMessage("Por favor selecciona una forma de envío a domicilio.");
        return;
      }

      const isMontevideo = dept === "Montevideo";

      if (isMontevideo) {
        if (!street.trim()) {
          setErrorMessage("Por favor ingresa la calle de entrega.");
          return;
        }
        if (deliveryPreference === "home" && !doorNumber.trim()) {
          setErrorMessage("Por favor ingresa el número de puerta.");
          return;
        }
        if (!neighborhood.trim()) {
          setErrorMessage("Por favor ingresa tu barrio de Montevideo.");
          return;
        }
      } else {
        // Outside Montevideo: either street (and optional door/solar/manzana) OR solar & manzana
        const hasStreet = !!street.trim();
        const hasDoor = !!doorNumber.trim();
        const hasSolarManzana = !!solar.trim() && !!manzana.trim();

        if (!hasStreet && !hasSolarManzana) {
          setErrorMessage("Por favor ingresa la calle o, en su defecto, la Manzana y Solar de entrega.");
          return;
        }
        if (deliveryPreference === "home" && !hasDoor && !hasSolarManzana) {
          setErrorMessage("Por favor ingresa el número de puerta, o la Manzana y el Solar de entrega.");
          return;
        }
      }

      if (!city.trim()) {
        setErrorMessage("Por favor ingresa la localidad o ciudad.");
        return;
      }

      let addressStr = "";
      if (deliveryPreference === "agency") {
        addressStr = `RETIRO EN SUCURSAL / AGENCIA - `;
      }

      const addrParts: string[] = [];
      if (street.trim()) {
        addrParts.push(`Calle: ${street.trim()}`);
      }
      if (deliveryPreference !== "agency" && doorNumber.trim()) {
        addrParts.push(`Nº: ${doorNumber.trim()}`);
      }
      if (deliveryPreference !== "agency" && apartment.trim()) {
        addrParts.push(`Apto: ${apartment.trim()}`);
      }
      if (!isMontevideo) {
        if (manzana.trim()) {
          addrParts.push(`Manzana: ${manzana.trim()}`);
        }
        if (solar.trim()) {
          addrParts.push(`Solar: ${solar.trim()}`);
        }
      }
      if (isMontevideo && neighborhood.trim()) {
        addrParts.push(`Barrio: ${neighborhood.trim()}`);
      }

      addressStr += addrParts.join(", ");
      addressStr += `, Localidad: ${city.trim()}, Dpto: ${dept}`;
      if (shippingNotes.trim()) {
        addressStr += ` (Ref: ${shippingNotes.trim()})`;
      }
      finalShippingAddress = addressStr;

      const chosenMethod = deliveryMethods.find(m => m.id === selectedDeliveryMethod);
      deliveryCarrierInfo = chosenMethod ? chosenMethod.title : selectedDeliveryMethod;
    }

    const compiledUserInformation = {
      name: `${firstName.trim()} ${lastName.trim()}`,
      phone: phone.trim(),
      rut: wantsInvoice ? `RUT: ${rutNumber.trim()} (${companyName.trim()}) - Dir. Fiscal: ${fiscalAddress.trim()}` : "Consumidor Final (No RUT)",
      address: finalShippingAddress,
      shippingType: shippingType === "pickup" 
        ? "Retiro en Local" 
        : `Envío a Domicilio (${deliveryCarrierInfo})${hasFreeShipping ? " 🎁 [¡ENVÍO GRATIS!]" : ""}`
    };

    if (paymentMethod === "mercadopago") {
      setIsProcessing(true);
      try {
        // Map individual product options to order item interfaces
        const mappedOrderItems = cartItems.map((item) => {
          let basePrice = item.product.price;
          const p = item.product;
          let matchedVariantId: string | undefined = undefined;
          if (p.variants && p.variants.length > 0 && item.selectedSize) {
            const exactMatch = item.selectedColor 
              ? p.variants.find((v: any) => v.size === item.selectedSize && v.color === item.selectedColor)
              : null;
            const sizeMatch = p.variants.find((v: any) => v.size === item.selectedSize);
            const match = exactMatch || sizeMatch;
            if (match) {
              if (match.price !== undefined) {
                basePrice = match.price;
              }
              matchedVariantId = match.id;
            }
          }
          return {
            productId: item.product.id,
            variantId: matchedVariantId,
            productName: item.product.name,
            sku: item.product.variants?.[0]?.sku || undefined,
            sizeSelected: item.selectedSize || undefined,
            colorSelected: item.selectedColor || undefined,
            unitPrice: basePrice,
            quantity: item.quantity,
            totalPrice: basePrice * item.quantity
          };
        });

        // 1. Pre-register order in database to ensure we do not lose sales leads
        const orderRegResponse = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            customerName: compiledUserInformation.name,
            customerEmail: "cliente@tienda.com",
            customerPhone: compiledUserInformation.phone,
            subtotal: subtotalUYU,
            discountAmount: discountAmountUYU,
            shippingCost: 0,
            total: totalUYU,
            couponCode: appliedDiscount > 0 ? promoCode.toUpperCase() : undefined,
            notes: `${shippingType === "pickup" ? "Retiro en Local de la Empresa" : "Envío a Domicilio: " + finalShippingAddress} | ${compiledUserInformation.rut}`,
            items: mappedOrderItems
          })
        });

        if (!orderRegResponse.ok) {
          const errData = await orderRegResponse.json();
          throw new Error(errData.message || "Error al pre-registrar tu orden en la base de datos.");
        }

        const registeredOrder = await orderRegResponse.json();
        const serverOrderId = registeredOrder.orderId;

        // 2. Generate checkout preference linking it to our brand new Order ID
        const response = await fetch("/api/payments/mercadopago/preference", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            cartItems: cartItems,
            userInfo: {
              name: compiledUserInformation.name,
              address: `${shippingType === "pickup" ? "Retiro en Empresa" : "Envío a Domicilio: " + finalShippingAddress} | Tel: ${compiledUserInformation.phone} | ${compiledUserInformation.rut}`
            },
            discountPercent: appliedDiscount,
            appliedPromo: appliedDiscount > 0 ? promoCode.toUpperCase() : "",
            orderId: serverOrderId
          })
        });

        const data = await response.json();
        if (response.ok && data.success && data.initPoint) {
          // Send to official secure payment gateway
          window.location.href = data.initPoint;
        } else {
          const detailMsg = data.detail ? `${data.message} Detalles: ${data.detail}` : (data.message || "Error al iniciar el pago con Mercado Pago.");
          setErrorMessage(detailMsg);
          setIsProcessing(false);
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Hubo un problema de conexión con el servidor de Mercado Pago.");
        setIsProcessing(false);
      }
    } else {
      // WhatsApp manual/coordinated checkout text build
      let paymentLabel = "";
      if (paymentMethod === "transfer") {
        paymentLabel = "Transferencia Bancaria Uruguaya (BROU, Itaú, Santander)";
      } else if (paymentMethod === "cash") {
        paymentLabel = "Efectivo Contraentrega (al recibir)";
      } else {
        paymentLabel = "Coordinar método especial";
      }

      let message = `🛒 *NUEVO PEDIDO - ${settings.siteTitle}*\n\n`;
      message += `👤 *Cliente:* ${compiledUserInformation.name}\n`;
      message += `📞 *Teléfono:* ${compiledUserInformation.phone}\n`;
      message += `📄 *Facturación:* ${compiledUserInformation.rut}\n`;
      message += `🚚 *Método de Envío:* ${compiledUserInformation.shippingType}\n`;
      if (shippingType === "delivery") {
        message += `📍 *Dirección de envío:* ${compiledUserInformation.address}\n`;
      }
      message += `💳 *Método de Pago:* ${paymentLabel}\n`;
      if (appliedDiscount > 0) {
        message += `🎟️ *Cupón Aplicado:* ${promoCode.toUpperCase()} (${appliedDiscount}% desc.)\n`;
      }
      message += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n`;

      cartItems.forEach((item, index) => {
        const is3D = is3DProduct(item.product);
        const options = [];
        if (item.selectedSize) {
          options.push(is3D ? `Material: ${item.selectedSize}` : `Talle: ${item.selectedSize}`);
        }
        if (item.selectedColor) {
          options.push(`Color: ${item.selectedColor}`);
        }
        const optionsStr = options.length > 0 ? ` (${options.join(", ")})` : "";
        const itemPrice = getItemPrice(item);
        
        message += `${index + 1}. *${item.product.name}*${optionsStr}\n`;
        message += `   👉 ${item.quantity} x UYU $${Math.round(itemPrice)} = *UYU $${Math.round(itemPrice * item.quantity)}*\n\n`;
      });

      message += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
      message += `🔹 *Subtotal:* UYU $${subtotalUYU}\n`;
      if (appliedDiscount > 0) {
        message += `🔹 *Descuento (${appliedDiscount}%):* -UYU $${discountAmountUYU}\n`;
      }
      message += `🔥 *TOTAL NETO:* *UYU $${totalUYU}*\n\n`;
      
      if (paymentMethod === "transfer") {
        message += `🏦 _Hola, acabo de realizar la compra. Por favor, facilítenme los datos de su cuenta bancaria para efectuar la transferencia de UYU $${totalUYU} y coordinar la entrega._`;
      } else {
        message += `🙌 _¡Hola! Acabo de coordinar este pedido por la web. Quedo a la espera para coordinar los detalles de entrega de mi compra por UYU $${totalUYU}._`;
      }

      const encodedText = encodeURIComponent(message);
      const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, "");
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
      
      window.open(waUrl, "_blank", "referrer");
      onClearCart();
      onBackToCatalog();
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen py-16 flex flex-col items-center justify-center text-center px-4 font-sans text-white bg-slate-900">
        <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center text-zinc-400 mb-4 border border-zinc-700">
          🛒
        </div>
        <h2 className="text-xl font-bold text-zinc-100 mb-2">Su carrito está vacío</h2>
        <p className="text-sm text-zinc-400 mb-6 max-w-sm">
          No hay artículos listados para iniciar el checkout. Elige tus favoritos en nuestra tienda.
        </p>
        <button
          onClick={onBackToCatalog}
          className="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider theme-btn-primary transition cursor-pointer"
        >
          Volver a la Tienda
        </button>
      </div>
    );
  }

  const isDark = settings.themeMode === "dark";

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-250 ${
      isDark ? "bg-zinc-950 text-white" : "bg-slate-50 text-zinc-900"
    }`}>
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation back and Brand Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <button
            onClick={onBackToCatalog}
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl border transition ${
              isDark 
                ? "text-zinc-300 hover:text-white bg-zinc-900 border-zinc-800 hover:bg-zinc-800" 
                : "text-zinc-600 hover:text-zinc-900 bg-white border-gray-200 hover:bg-gray-100 shadow-sm"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a la Tienda</span>
          </button>
          
          <div className="text-right">
            <h1 className="text-2xl font-black tracking-tight theme-text-primary uppercase">
              {settings.siteTitle || "Ventas Juem"} Checkout
            </h1>
            <p className={`text-xs mt-1 font-medium ${isDark ? "text-zinc-400" : "text-zinc-505"}`}>
              Entrega rápida y pagos seguros directos para Uruguay
            </p>
          </div>
        </div>

        {/* Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Data to fill */}
          <div className="lg:col-span-7 space-y-6">
            {checkoutStep === "details" && (
              <div className="space-y-6">

                {/* Box 1: DATOS DEL COMPRADOR */}
            <div className={`p-6 rounded-2xl border transition-all ${
              isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200 shadow-sm"
            }`}>
              <h2 className="text-base font-extrabold tracking-tight mb-4 uppercase flex items-center gap-2.5">
                <span className="p-1 px-2.5 bg-sky-500/10 text-sky-400 rounded-lg text-xs font-black">1</span>
                Datos del Comprador
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 px-1 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-450" />
                    <input
                      required
                      type="text"
                      placeholder="Ej: Juan"
                      value={firstName}
                      onChange={(e) => handleFieldChange("firstName", e.target.value)}
                      className={`w-full text-xs pl-10 pr-4 py-3 rounded-xl border outline-none transition uppercase font-mono tracking-wide ${
                        touchedFields["firstName"]
                          ? validationErrors["firstName"]
                            ? isDark
                              ? "border-red-500 bg-red-955/20 text-white focus:border-red-400 focus:bg-zinc-900"
                              : "border-red-500 bg-red-50/50 text-zinc-900 focus:border-red-600 focus:bg-white"
                            : isDark
                              ? "border-green-500 bg-green-955/20 text-white focus:border-green-400 focus:bg-zinc-900"
                              : "border-green-500 bg-green-50/50 text-zinc-900 focus:border-green-600 focus:bg-white"
                          : isDark
                            ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-655 focus:border-zinc-700"
                            : "bg-stone-50 border-gray-300 text-zinc-900 placeholder-zinc-450 focus:border-sky-500 focus:bg-white"
                      }`}
                    />
                  </div>
                  {touchedFields["firstName"] && validationErrors["firstName"] && (
                    <p className="text-[11px] text-red-500 font-bold mt-1 px-1 flex items-center gap-1 font-mono">
                      <span>⚠️</span> {validationErrors["firstName"]}
                    </p>
                  )}
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 px-1 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-450" />
                    <input
                      required
                      type="text"
                      placeholder="Ej: Pérez"
                      value={lastName}
                      onChange={(e) => handleFieldChange("lastName", e.target.value)}
                      className={`w-full text-xs pl-10 pr-4 py-3 rounded-xl border outline-none transition uppercase font-mono tracking-wide ${
                        touchedFields["lastName"]
                          ? validationErrors["lastName"]
                            ? isDark
                              ? "border-red-500 bg-red-955/20 text-white focus:border-red-400 focus:bg-zinc-900"
                              : "border-red-500 bg-red-50/50 text-zinc-900 focus:border-red-600 focus:bg-white"
                            : isDark
                              ? "border-green-500 bg-green-955/20 text-white focus:border-green-400 focus:bg-zinc-900"
                              : "border-green-500 bg-green-50/50 text-zinc-900 focus:border-green-600 focus:bg-white"
                          : isDark
                            ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-655 focus:border-zinc-700"
                            : "bg-stone-50 border-gray-300 text-zinc-900 placeholder-zinc-450 focus:border-sky-500 focus:bg-white"
                      }`}
                    />
                  </div>
                  {touchedFields["lastName"] && validationErrors["lastName"] && (
                    <p className="text-[11px] text-red-500 font-bold mt-1 px-1 flex items-center gap-1 font-mono">
                      <span>⚠️</span> {validationErrors["lastName"]}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 px-1 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                    Teléfono de Contacto <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-450" />
                    <input
                      required
                      type="tel"
                      placeholder="Ej: 099123456"
                      value={phone}
                      onChange={(e) => handleFieldChange("phone", e.target.value)}
                      className={`w-full text-xs pl-10 pr-4 py-3 rounded-xl border outline-none transition font-mono tracking-widest ${
                        touchedFields["phone"]
                          ? validationErrors["phone"]
                            ? isDark
                              ? "border-red-500 bg-red-955/20 text-white focus:border-red-400 focus:bg-zinc-900"
                              : "border-red-500 bg-red-50/50 text-zinc-900 focus:border-red-600 focus:bg-white"
                            : isDark
                              ? "border-green-500 bg-green-955/20 text-white focus:border-green-400 focus:bg-zinc-900"
                              : "border-green-500 bg-green-50/50 text-zinc-900 focus:border-green-600 focus:bg-white"
                          : isDark
                            ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-655 focus:border-zinc-700"
                            : "bg-stone-50 border-gray-300 text-zinc-900 placeholder-zinc-450 focus:border-sky-500 focus:bg-white"
                      }`}
                    />
                  </div>
                  {touchedFields["phone"] && validationErrors["phone"] && (
                    <p className="text-[11px] text-red-500 font-bold mt-1 px-1 flex items-center gap-1 font-mono">
                      <span>⚠️</span> {validationErrors["phone"]}
                    </p>
                  )}
                </div>

                {/* RUT Invoice details field */}
                {settings.invoiceOptionActive !== false && (
                  <div className="md:col-span-2 pt-2">
                    <div className={`p-4 rounded-xl border ${
                      isDark ? "bg-zinc-950/40 border-zinc-800" : "bg-slate-50 border-gray-200"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4.5 w-4.5 text-zinc-400" />
                          <div>
                            <span className="text-xs font-extrabold uppercase tracking-wider">Factura con RUT de Empresa</span>
                            <p className="text-[10px] text-zinc-500 leading-normal">Solicita factura oficial con RUT uruguayo para tu empresa</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 bg-zinc-805 p-0.5 rounded-lg border border-zinc-700">
                          <button
                            type="button"
                            onClick={() => {
                              setWantsInvoice(false);
                              // clear errors for invoice fields since they are not used
                              setValidationErrors(prev => ({
                                ...prev,
                                rutNumber: "",
                                companyName: "",
                                fiscalAddress: ""
                              }));
                            }}
                            className={`text-[10px] uppercase font-mono px-2.5 py-1 rounded-md transition font-black ${
                              !wantsInvoice 
                                ? "bg-sky-500 text-white" 
                                : "text-zinc-440 hover:text-white"
                            }`}
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setWantsInvoice(true);
                              // Trigger state evaluation
                              setTimeout(() => {
                                setTouchedFields(prev => ({
                                  ...prev,
                                  rutNumber: true,
                                  companyName: true,
                                  fiscalAddress: true
                                }));
                                setValidationErrors(prev => ({
                                  ...prev,
                                  rutNumber: validateField("rutNumber", rutNumber, true),
                                  companyName: validateField("companyName", companyName, true),
                                  fiscalAddress: validateField("fiscalAddress", fiscalAddress, true)
                                }));
                              }, 10);
                            }}
                            className={`text-[10px] uppercase font-mono px-2.5 py-1 rounded-md transition font-black ${
                              wantsInvoice 
                                ? "bg-sky-500 text-white" 
                                : "text-zinc-440 hover:text-white"
                            }`}
                          >
                            Sí
                          </button>
                        </div>
                      </div>

                      {wantsInvoice && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-3 pt-3 border-t border-dashed border-zinc-800">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">RUT de Empresa (12 dígitos) <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              placeholder="Ej: 219999990011"
                              value={rutNumber}
                              onChange={(e) => handleFieldChange("rutNumber", e.target.value)}
                              className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-mono ${
                                touchedFields["rutNumber"]
                                  ? validationErrors["rutNumber"]
                                    ? isDark
                                      ? "border-red-500 bg-red-955/20 text-white focus:border-red-400 focus:bg-zinc-900"
                                      : "border-red-500 bg-red-50/50 text-zinc-900 focus:border-red-610 focus:bg-white"
                                    : isDark
                                      ? "border-green-500 bg-green-955/20 text-white focus:border-green-400 focus:bg-zinc-900"
                                      : "border-green-500 bg-green-50/50 text-zinc-900 focus:border-green-610 focus:bg-white"
                                  : isDark 
                                    ? "bg-zinc-900 border-zinc-850 text-white focus:border-zinc-700" 
                                    : "bg-white border-gray-300 text-zinc-900"
                              }`}
                            />
                            {touchedFields["rutNumber"] && validationErrors["rutNumber"] && (
                              <p className="text-[10px] text-red-500 font-bold mt-1 px-1 flex items-center gap-1 font-mono">
                                <span>⚠️</span> {validationErrors["rutNumber"]}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Razón Social <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              placeholder="Ej: Pérez Hnos S.A."
                              value={companyName}
                              onChange={(e) => handleFieldChange("companyName", e.target.value)}
                              className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${
                                touchedFields["companyName"]
                                  ? validationErrors["companyName"]
                                    ? isDark
                                      ? "border-red-500 bg-red-955/20 text-white focus:border-red-400 focus:bg-zinc-900"
                                      : "border-red-500 bg-red-50/50 text-zinc-900 focus:border-red-610 focus:bg-white"
                                    : isDark
                                      ? "border-green-500 bg-green-955/20 text-white focus:border-green-400 focus:bg-zinc-900"
                                      : "border-green-500 bg-green-50/50 text-zinc-900 focus:border-green-610 focus:bg-white"
                                  : isDark 
                                    ? "bg-zinc-900 border-zinc-850 text-white focus:border-zinc-700" 
                                    : "bg-white border-gray-300 text-zinc-900"
                              }`}
                            />
                            {touchedFields["companyName"] && validationErrors["companyName"] && (
                              <p className="text-[10px] text-red-500 font-bold mt-1 px-1 flex items-center gap-1 font-mono">
                                <span>⚠️</span> {validationErrors["companyName"]}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Dirección Fiscal <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              placeholder="Ej: Av. Uruguay 1234, Montevideo"
                              value={fiscalAddress}
                              onChange={(e) => handleFieldChange("fiscalAddress", e.target.value)}
                              className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${
                                touchedFields["fiscalAddress"]
                                  ? validationErrors["fiscalAddress"]
                                    ? isDark
                                      ? "border-red-500 bg-red-955/20 text-white focus:border-red-400 focus:bg-zinc-900"
                                      : "border-red-500 bg-red-50/50 text-zinc-900 focus:border-red-610 focus:bg-white"
                                    : isDark
                                      ? "border-green-500 bg-green-955/20 text-white focus:border-green-400 focus:bg-zinc-900"
                                      : "border-green-500 bg-green-50/50 text-zinc-900 focus:border-green-610 focus:bg-white"
                                  : isDark 
                                    ? "bg-zinc-900 border-zinc-850 text-white focus:border-zinc-700" 
                                    : "bg-white border-gray-300 text-zinc-900"
                              }`}
                            />
                            {touchedFields["fiscalAddress"] && validationErrors["fiscalAddress"] && (
                              <p className="text-[10px] text-red-500 font-bold mt-1 px-1 flex items-center gap-1 font-mono">
                                <span>⚠️</span> {validationErrors["fiscalAddress"]}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Box 2: FORMA DE ENVÍO */}
            {(settings.pickupActive !== false || settings.deliveryActive !== false) && (
              <div className={`p-6 rounded-2xl border transition-all ${
                isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200 shadow-sm"
              }`}>
                <h2 className="text-base font-extrabold tracking-tight mb-4 uppercase flex items-center gap-2.5">
                  <span className="p-1 px-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-black">2</span>
                  Forma de Envío
                </h2>

                {/* Toggle tabs to choose pickup vs delivery, only if both are enabled */}
                {(settings.pickupActive !== false && settings.deliveryActive !== false) && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setShippingType("pickup")}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-bold font-sans transition cursor-pointer text-xs uppercase tracking-wider ${
                        shippingType === "pickup"
                          ? "border-sky-500 bg-sky-950/25 text-sky-400"
                          : isDark
                            ? "border-zinc-850 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white"
                            : "border-gray-200 bg-white text-zinc-650 hover:border-gray-300 hover:text-zinc-900 shadow-sm"
                      }`}
                    >
                      <Home className="h-4.5 w-4.5" />
                      <span>Retiro en empresa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShippingType("delivery")}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-bold font-sans transition cursor-pointer text-xs uppercase tracking-wider ${
                        shippingType === "delivery"
                          ? "border-sky-500 bg-sky-950/25 text-sky-400"
                          : isDark
                            ? "border-zinc-850 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white"
                            : "border-gray-200 bg-white text-zinc-650 hover:border-gray-300 hover:text-zinc-900 shadow-sm"
                      }`}
                    >
                      <Truck className="h-4.5 w-4.5" />
                      <span>Envío a domicilio</span>
                    </button>
                  </div>
                )}

                {/* Pickup view showing local business address */}
                {shippingType === "pickup" && (
                  <div className={`p-5 rounded-xl border text-left flex items-start gap-4 transition-all ${
                    (settings.pickupActive !== false && settings.deliveryActive !== false) ? "mt-4" : ""
                  } ${
                    isDark ? "bg-zinc-950/60 border-zinc-800" : "bg-indigo-50/50 border-indigo-100"
                  }`}>
                    <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 flex-shrink-0">
                      <Building className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-indigo-450 mb-1.5 uppercase tracking-wide">Dirección Física del Local Comercial</h4>
                      <p className={`text-xs font-semibold ${isDark ? "text-zinc-200" : "text-zinc-705"}`}>
                        📍 {settings.pickupAddress || "Av. Italia 3824, Parque Batlle, Montevideo, Uruguay"}
                      </p>
                      <p className="text-[11px] text-zinc-450 mt-1 leading-relaxed">
                        Horario de atención: {settings.pickupHours || "Lunes a Viernes de 10:00 a 18:00 hs y Sábados de 09:00 a 13:00 hs."}
                      </p>
                      <p className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                        ✓ {settings.pickupSuccessMessage || "Listo para retirar el mismo día hábil"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Box 3: DIRECCIÓN Y ENVÍO (Domicilio flow only) */}
            {shippingType === "delivery" && (
              <div className={`p-6 rounded-2xl border transition-all ${
                isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200 shadow-sm"
              }`}>
                <h2 className="text-base font-extrabold tracking-tight mb-4 uppercase flex items-center gap-2.5">
                  <span className="p-1 px-2.5 bg-emerald-500/10 text-emerald-450 rounded-lg text-xs font-black">3</span>
                  Dirección y Envío
                </h2>

                {/* Mis direcciones block */}
                <div className="flex items-center justify-between mb-4 border-t pt-4 border-dashed border-zinc-850">
                  <h3 className="text-sm font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="h-4.5 w-4.5 text-sky-400" />
                    Mis direcciones
                  </h3>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode("add");
                      setEditingAddressId(null);
                      setModalDept("Montevideo");
                      setModalZone("Paso de la Arena");
                      setModalStreet("");
                      setModalDoorNumber("");
                      setModalApartment("");
                      setModalSolar("");
                      setModalManzana("");
                      setModalError("");
                      setIsAddressModalOpen(true);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition duration-150 cursor-pointer ${
                      isDark 
                        ? "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/60" 
                        : "border-gray-300 text-zinc-705 hover:bg-gray-50 hover:border-gray-400"
                    }`}
                  >
                    <PlusCircle className="h-4 w-4 text-sky-400" />
                    Agregar dirección
                  </button>
                </div>

                {/* Stored Address List */}
                <div className="space-y-2 mb-6">
                  {addresses.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20 text-xs text-zinc-400">
                      No tienes direcciones guardadas. Pulsa en agregar para registrar una.
                    </div>
                  ) : (
                    addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      const hasStreet = !!addr.street.trim();
                      const hasDoor = !!addr.doorNumber.trim();
                      const hasMz = addr.dept !== "Montevideo" && addr.manzana && addr.manzana.trim();
                      const hasSl = addr.dept !== "Montevideo" && addr.solar && addr.solar.trim();
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                            isSelected
                              ? "border-sky-500 bg-sky-950/10"
                              : isDark ? "bg-zinc-950/40 border-zinc-855 hover:border-zinc-800" : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center flex-shrink-0">
                              <div className={`h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? "border-sky-500" : "border-zinc-650"
                              }`}>
                                {isSelected && <div className="h-2 w-2 rounded-full bg-sky-500" />}
                              </div>
                            </div>
                            <div>
                              <span className={`text-xs block font-bold uppercase tracking-wide ${isDark ? "text-zinc-150" : "text-zinc-800"}`}>
                                {[
                                  hasStreet ? addr.street : "",
                                  hasDoor ? addr.doorNumber : "",
                                  addr.apartment ? `Apto ${addr.apartment}` : "",
                                  hasMz ? `Manzana ${addr.manzana}` : "",
                                  hasSl ? `Solar ${addr.solar}` : ""
                                ].filter(Boolean).join(" ")}
                              </span>
                              <span className="text-[10px] text-zinc-500 block font-mono">
                                {addr.zone}, {addr.dept}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                               type="button"
                               onClick={() => {
                                 setModalMode("edit");
                                 setEditingAddressId(addr.id);
                                 setModalDept(addr.dept);
                                 setModalZone(addr.zone);
                                 setModalStreet(addr.street);
                                 setModalDoorNumber(addr.doorNumber);
                                 setModalApartment(addr.apartment || "");
                                 setModalSolar(addr.solar || "");
                                 setModalManzana(addr.manzana || "");
                                 setModalError("");
                                 setIsAddressModalOpen(true);
                               }}
                              className="p-1 px-2 rounded-md hover:bg-zinc-800/60 text-zinc-400 hover:text-white transition"
                              title="Editar dirección"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const filtered = addresses.filter(a => a.id !== addr.id);
                                setAddresses(filtered);
                                if (selectedAddressId === addr.id && filtered.length > 0) {
                                  setSelectedAddressId(filtered[0].id);
                                } else if (filtered.length === 0) {
                                  setSelectedAddressId("");
                                }
                              }}
                              className="p-1 px-2 rounded-md hover:bg-red-950/20 text-zinc-400 hover:text-red-400 transition"
                              title="Eliminar dirección"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Carrier checkboxes precisely from image */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold uppercase tracking-wider px-1 text-zinc-450 mb-1">
                    Elegí la Forma de Envío a Domicilio:
                  </label>
                  
                  {deliveryMethods.map((method) => {
                    const isSelected = selectedDeliveryMethod === method.id;
                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedDeliveryMethod(method.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected
                            ? "border-sky-500 bg-sky-950/15"
                            : isDark ? "bg-zinc-900/60 border-zinc-850 hover:border-zinc-800" : "bg-white border-gray-255 hover:border-gray-205"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center flex-shrink-0">
                            <div className={`h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-sky-500" : "border-zinc-600"
                            }`}>
                              {isSelected && <div className="h-2 w-2 rounded-full bg-sky-500" />}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {method.iconType === "motorcycle" && (
                              <div className="flex-shrink-0 shadow-sm border border-pink-100/30 rounded-lg overflow-hidden bg-white">
                                <svg className="w-14 h-9" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <rect width="48" height="32" rx="6" fill="#FCE7F3" />
                                  <g transform="translate(6, 4)">
                                    <circle cx="9" cy="20" r="3.5" fill="#1F2937" />
                                    <circle cx="9" cy="20" r="1.2" fill="#FFFFFF" />
                                    <circle cx="27" cy="20" r="3.5" fill="#1F2937" />
                                    <circle cx="27" cy="20" r="1.2" fill="#FFFFFF" />
                                    <path d="M 9 20 L 13 16 L 22 16 L 27 20" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M 27 20 L 25 10 L 22 10" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" />
                                    <circle cx="18" cy="8" r="2.5" fill="#374151" />
                                    <path d="M 15 11 L 21 11 L 20 16 L 16 16 Z" fill="#3B82F6" />
                                    <path d="M 20 12 L 23 12" stroke="#374151" strokeWidth="1" />
                                    <rect x="7" y="7" width="7" height="7" rx="1" fill="#D97706" />
                                    <line x1="10.5" y1="7" x2="10.5" y2="14" stroke="#78350F" strokeWidth="0.8" />
                                  </g>
                                </svg>
                              </div>
                            )}
                            {method.iconType === "truck_orange" && (
                              <div className="flex-shrink-0 shadow-sm border border-orange-100/30 rounded-lg overflow-hidden bg-white">
                                <svg className="w-14 h-9" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <rect width="48" height="32" rx="6" fill="#FFEDD5" />
                                  <g transform="translate(6, 4)">
                                    <path d="M 22 6 H 29 L 32 11 L 32 17 H 22 Z" fill="#F97316" />
                                    <path d="M 24 8 H 28 L 29.5 11 H 24 Z" fill="#E0F2FE" stroke="#0284C7" strokeWidth="0.5" />
                                    <rect x="2" y="4" width="20" height="13" rx="1.5" fill="#EA580C" />
                                    <circle cx="7" cy="18" r="3" fill="#1F2937" />
                                    <circle cx="7" cy="18" r="1" fill="#E5E7EB" />
                                    <circle cx="26" cy="18" r="3" fill="#1F2937" />
                                    <circle cx="26" cy="18" r="1" fill="#E5E7EB" />
                                    <rect x="0" y="14" width="2" height="3" fill="#9CA3AF" />
                                    <rect x="31" y="15" width="2" height="2" fill="#E5E7EB" />
                                  </g>
                                </svg>
                              </div>
                            )}
                            {method.iconType === "ues" && (
                              <div className="flex-shrink-0 shadow-xs rounded-lg overflow-hidden border border-gray-200">
                                <svg className="w-14 h-9" viewBox="0 0 54 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <rect width="54" height="32" rx="6" fill="#FFFFFF" />
                                  <g transform="translate(5, 5)">
                                    <path d="M 2 11 C 2 6.5 5.5 5 10 5 L 34 5 C 38.5 5 42 7.5 42 11 C 42 14.5 38.5 17 34 17 L 10 17 C 5.5 17 2 15.5 2 11 Z" fill="#EA580C" />
                                    <path d="M 5 6 L 10 11 L 5 16 H 8 L 13 11 L 8 6 Z" fill="#FFFFFF" />
                                    <text x="16" y="14.5" fill="#FFFFFF" fontSize="10.5" fontWeight="900" fontFamily="sans-serif" fontStyle="italic" letterSpacing="-0.5">Ues</text>
                                  </g>
                                </svg>
                              </div>
                            )}
                            {method.iconType === "dac" && (
                              <div className="flex-shrink-0 shadow-xs rounded-lg overflow-hidden border border-gray-200">
                                <svg className="w-14 h-9" viewBox="0 0 54 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <rect width="54" height="32" rx="6" fill="#FFFFFF" />
                                  <g transform="translate(2, 4)">
                                    <path d="M 4 8 L 10 12 L 4 16 Z" fill="#047857" />
                                    <path d="M 10 8 L 16 12 L 10 16 Z" fill="#B91C1C" />
                                    <text x="19" y="14" fill="#111827" fontSize="11" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.2">DAC</text>
                                    <text x="4" y="22" fill="#4B5563" fontSize="4.8" fontWeight="850" fontFamily="sans-serif" letterSpacing="0.1">GRUPO AGENCIA</text>
                                  </g>
                                </svg>
                              </div>
                            )}
                            {method.iconType === "depunta" && (
                              <div className="flex-shrink-0 shadow-xs rounded-lg overflow-hidden border border-gray-200">
                                <svg className="w-14 h-9" viewBox="0 0 54 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <rect width="54" height="32" rx="6" fill="#FFFFFF" />
                                  <g transform="translate(4, 4)">
                                    <circle cx="11" cy="12" r="8" fill="#B91C1C" />
                                    <text x="11.2" y="14.5" fill="#FFFFFF" fontSize="7" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">DE</text>
                                    <text x="21.5" y="15" fill="#111827" fontSize="9.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.2">PUNTA</text>
                                  </g>
                                </svg>
                              </div>
                            )}

                            {!(["motorcycle", "truck_orange", "ues", "dac", "depunta"].includes(method.iconType)) && (
                              <div className="flex-shrink-0 shadow-xs rounded-lg overflow-hidden border border-gray-200 w-14 h-9 bg-zinc-800 text-zinc-400 flex items-center justify-center">
                                <Truck className="h-5 w-5" />
                              </div>
                            )}

                            <div>
                              <span className={`text-xs block font-bold leading-tight ${isDark ? "text-zinc-100" : "text-zinc-800"}`}>
                                {method.title}
                              </span>
                              {method.subtext && (
                                <span className="text-[10px] text-zinc-450 italic font-mono block mt-0.5">{method.subtext}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Info Note regarding paying at destination for agencies */}
                {(selectedDeliveryMethod === "ues" || selectedDeliveryMethod === "dac" || selectedDeliveryMethod === "depunta") && !hasFreeShipping && (
                  <div className={`p-3.5 rounded-xl border flex items-start gap-3 mt-4 text-xs transition-colors ${
                    isDark 
                      ? "bg-amber-950/20 border-amber-900/40 text-amber-300" 
                      : "bg-amber-50 border-amber-200 text-amber-805"
                  }`}>
                    <HelpCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold uppercase tracking-wide text-[10px] block mb-1">
                        Envío Por Agencia a pagar en destino:
                      </span>
                      <p className="leading-relaxed font-bold text-amber-100">
                        El costo del paquete lo paga el cliente al recibirlo.
                      </p>
                    </div>
                  </div>
                )}

                {/* Free Shipping Alert Box */}
                {hasFreeShipping && (
                  <div className={`p-4 rounded-xl border flex items-start gap-3 mt-4 text-xs transition-colors ${
                    isDark 
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300" 
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}>
                    <span className="text-xl">🎁</span>
                    <div>
                      <span className="font-extrabold uppercase tracking-widest text-[10px] block text-emerald-400 mb-1">
                        ¡Envío Gratis Aplicado!
                      </span>
                      <p className="leading-relaxed">
                        Tu compra supera el monto de <strong>${settings.freeShippingMinAmount !== undefined ? settings.freeShippingMinAmount : 2000}</strong> y la zona de entrega (<strong>{neighborhood}</strong>) califica para el beneficio único en la zona de {settings.freeShippingRegions || "Pinamar, Salinas, Marindia, Neptunia"}. ¡Tu envío no tendrá costo!
                      </p>
                    </div>
                  </div>
                )}


              </div>
            )}
              </div>
            )}
            {checkoutStep === "payment" && (
              <div className="space-y-6 animate-fade-in">
                {/* Back Link to edit details */}
                <button
                  type="button"
                  onClick={() => setCheckoutStep("details")}
                  className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl border transition cursor-pointer ${
                    isDark 
                      ? "text-zinc-400 hover:text-white bg-zinc-900 border-zinc-800 hover:bg-zinc-800" 
                      : "text-zinc-650 hover:text-zinc-900 bg-white border-gray-200 hover:bg-gray-100 shadow-sm"
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Modificar Datos de Envío</span>
                </button>

                {/* Box 4: OPCIÓN DE PAGO */}
                <div className={`p-6 rounded-2xl border transition-all ${
                  isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200 shadow-sm"
                }`}>
                  <h2 className="text-base font-extrabold tracking-tight mb-4 uppercase flex items-center gap-2.5">
                    <span className="p-1 px-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-black">4</span>
                    Método de Pago
                  </h2>
                  <p className={`text-xs mb-6 font-medium ${isDark ? "text-zinc-400" : "text-zinc-550"}`}>
                    Selecciona tu opción de pago preferida para completar tu compra:
                  </p>

                  <div className="space-y-4">
                    {/* Option 1: Mercado Pago */}
                    {settings.mercadopagoActive !== false && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("mercadopago")}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 cursor-pointer ${
                          paymentMethod === "mercadopago"
                            ? "border-sky-500 bg-sky-500/5"
                            : isDark
                              ? "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                              : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-center pt-0.5">
                          <div className={`h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === "mercadopago" ? "border-sky-500" : "border-zinc-600"
                          }`}>
                            {paymentMethod === "mercadopago" && <div className="h-2 w-2 rounded-full bg-sky-500" />}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-white" : "text-zinc-800"}`}>
                              Mercado Pago (100% Seguro)
                            </span>
                            <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-md">
                              Online Inmediato
                            </span>
                          </div>
                          <p className={`text-[11px] leading-relaxed mt-1 font-semibold ${isDark ? "text-zinc-400" : "text-zinc-550"}`}>
                            Tarjetas de Crédito, Débito Bancario o Redes de Cobranza (Abitab y Redpagos).
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Option 2: Transferencia Bancaria */}
                    {settings.transferActive !== false && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("transfer")}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 cursor-pointer ${
                          paymentMethod === "transfer"
                            ? "border-sky-500 bg-sky-500/5"
                            : isDark
                              ? "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                              : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-center pt-0.5">
                          <div className={`h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === "transfer" ? "border-sky-500" : "border-zinc-600"
                          }`}>
                            {paymentMethod === "transfer" && <div className="h-2 w-2 rounded-full bg-sky-500" />}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-white" : "text-zinc-800"}`}>
                              Transferencia Bancaria Directa
                            </span>
                            <span className="text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-md">
                              BROU, Itaú, Santander
                            </span>
                          </div>
                          <p className={`text-[11px] leading-relaxed mt-1 font-semibold ${isDark ? "text-zinc-400" : "text-zinc-550"}`}>
                            Transfiere en línea. Te facilitamos nuestra cuenta bancaria uruguaya y envías el comprobante por WhatsApp.
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Option 3: Efectivo Contraentrega */}
                    {settings.cashActive !== false && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cash")}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 cursor-pointer ${
                          paymentMethod === "cash"
                            ? "border-sky-500 bg-sky-500/5"
                            : isDark
                              ? "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                              : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-center pt-0.5">
                          <div className={`h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === "cash" ? "border-sky-500" : "border-zinc-600"
                          }`}>
                            {paymentMethod === "cash" && <div className="h-2 w-2 rounded-full bg-sky-500" />}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-white" : "text-zinc-800"}`}>
                              Efectivo Contraentrega
                            </span>
                            <span className="text-[9px] font-black uppercase bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-md">
                              Pagas al recibir
                            </span>
                          </div>
                          <p className={`text-[11px] leading-relaxed mt-1 font-semibold ${isDark ? "text-zinc-400" : "text-zinc-550"}`}>
                            Pagas directamente en mano al repartidor cuando recibas tu paquete en tu puerta.
                          </p>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Payment Explanatory detail block */}
                  <div className={`p-4 rounded-xl border mt-6 ${
                    isDark ? "bg-zinc-950/40 border-zinc-850" : "bg-slate-50 border-gray-200"
                  }`}>
                    {paymentMethod === "mercadopago" ? (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase text-sky-400 tracking-wider">Detalles de Mercado Pago</span>
                        <p className={`text-[11px] leading-relaxed font-semibold ${isDark ? "text-zinc-300" : "text-zinc-650"}`}>
                          Al dar clic en <strong className="text-sky-400">PAGAR CON MERCADO PAGO</strong>, se abrirá la pasarela oficial segura. Podrás pagar online con tarjeta de crédito en cómodas cuotas sin interés, débito directo, o solicitar un cupón para pagar en Abitab/Redpagos.
                        </p>
                      </div>
                    ) : paymentMethod === "transfer" ? (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider">Detalles de Transferencia Bancaria</span>
                        <p className={`text-[11px] leading-relaxed font-semibold ${isDark ? "text-zinc-300" : "text-zinc-650"}`}>
                          Al continuar a <strong className="text-white">REALIZAR PEDIDO VÍA WHATSAPP</strong>, se generará el detalle de tu compra y se abrirá WhatsApp con el mensaje pre-redactado. Te responderemos inmediatamente con los datos bancarios para coordinar.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase text-amber-500 tracking-wider">Detalles de Efectivo Contraentrega</span>
                        <p className={`text-[11px] leading-relaxed font-semibold ${isDark ? "text-zinc-300" : "text-zinc-650"}`}>
                          Al continuar a <strong className="text-white">REALIZAR PEDIDO VÍA WHATSAPP</strong>, coordinaremos el envío de tu paquete por mensajería. Le abonas el total neto al repartidor cuando toque tu timbre.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Order summary */}
          <div className="lg:col-span-5">
            <div className={`p-6 rounded-2xl border sticky top-6 ${
              isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200 shadow-sm"
            }`}>
              <h3 className="text-base font-bold mb-4 flex items-center justify-between border-b pb-3 border-zinc-800/80 uppercase">
                <span>Resumen de Compra</span>
                <span className="p-1 px-2.5 bg-zinc-850 rounded-lg text-xs font-semibold text-zinc-400 font-mono">
                  {cartItems.reduce((s, i) => s + i.quantity, 0)} {cartItems.reduce((s, i) => s + i.quantity, 0) === 1 ? "artículo" : "artículos"}
                </span>
              </h3>

              {/* Items display list */}
              <div className="max-h-60 overflow-y-auto space-y-3.5 pr-1.5 mb-4 custom-scrollbar">
                {cartItems.map((item) => {
                  const is3D = is3DProduct(item.product);
                  const priceUYU = getItemPrice(item);
                  return (
                    <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`} className="flex items-start gap-3 text-xs">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="h-14 w-11 object-cover rounded bg-zinc-800 border border-zinc-800/60 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold line-clamp-1 theme-text-primary text-zinc-100 dark:text-zinc-50 uppercase tracking-tight">
                          {item.product.name}
                        </h4>
                        
                        {(item.selectedSize || item.selectedColor) && (
                          <div className="flex gap-1.5 items-center mt-0.5 text-[9px] font-mono text-zinc-400">
                            {item.selectedSize && (
                              <span className="opacity-90">{is3D ? "Material" : "Talle"}: {item.selectedSize}</span>
                            )}
                            {item.selectedColor && (
                              <span className="opacity-90">Col: {item.selectedColor}</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between items-center mt-2.5">
                          <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-950 text-[10px] h-6 font-mono">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.quantity > 1) {
                                  onUpdateQuantity(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor);
                                } else {
                                  onRemoveItem(item.product.id, item.selectedSize, item.selectedColor);
                                }
                              }}
                              className="px-1.5 text-zinc-550 hover:text-red-400 transition cursor-pointer"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-1.5 text-zinc-200">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                              className="px-1.5 text-zinc-550 hover:text-emerald-450 transition cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-zinc-300 dark:text-zinc-200 text-xs">
                              UYU $ {Math.round(priceUYU * item.quantity)}
                            </span>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.product.id, item.selectedSize, item.selectedColor)}
                              className="text-zinc-650 hover:text-red-400 p-0.5 transition cursor-pointer"
                              title="Borrar artículo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Promo code */}
              <div className="flex gap-2 mb-4 pt-1">
                <input
                  type="text"
                  placeholder="Código de cupón (APEX50)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className={`flex-1 text-xs px-3 py-2.5 rounded-lg border outline-none font-mono tracking-wide ${
                    isDark
                      ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650 focus:border-zinc-700"
                      : "bg-white border-gray-300 text-zinc-900 placeholder-gray-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider theme-btn-accent cursor-pointer transition whitespace-nowrap"
                >
                  Aplicar
                </button>
              </div>

              {promoStatus === "success" && (
                <p className="text-[11px] text-emerald-400 font-semibold mb-3">✔️ ¡Descuento de {appliedDiscount}% aplicado con éxito!</p>
              )}
              {promoStatus === "invalid" && (
                <p className="text-[11px] text-red-450 font-semibold mb-3">❌ Código de cupón no válido o inactivo.</p>
              )}

              {/* Price Breakdown in UYU (strictly in Pesos Uruguayos) */}
              <div className={`p-4 rounded-xl space-y-2 mb-6 ${
                isDark ? "bg-zinc-950/85 border border-zinc-850" : "bg-slate-50 border border-gray-200"
              }`}>
                <div className="flex justify-between items-center text-xs text-zinc-400 uppercase tracking-wide">
                  <span>Subtotal</span>
                  <span className="font-mono text-xs font-bold text-zinc-300 dark:text-zinc-200">$ {subtotalUYU} UYU</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-450 uppercase tracking-wide">
                    <span>Descuento ({appliedDiscount}%)</span>
                    <span className="font-mono font-bold text-emerald-400">-$ {discountAmountUYU} UYU</span>
                  </div>
                )}
                {shippingType === "delivery" && (
                  <div className="flex justify-between items-center text-xs text-zinc-400 uppercase tracking-wide pt-0.5">
                    <span>Costo de Envío</span>
                    {hasFreeShipping ? (
                      <span className="font-sans text-[10px] font-black tracking-wide text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                        🎁 ¡GRATIS!
                      </span>
                    ) : (
                      <span className="font-sans text-[10px] text-zinc-400 font-semibold italic">
                        Cobro en destino
                      </span>
                    )}
                  </div>
                )}
                
                <hr className={`border-dashed my-1 ${isDark ? "border-zinc-800" : "border-gray-200"}`} />

                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-350 dark:text-zinc-200">TOTAL NETO A PAGAR</span>
                  <span className="text-xl font-black font-mono leading-none theme-text-primary text-emerald-400">
                    $ {totalUYU} UYU
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-950/35 border border-red-900/30 text-rose-400 text-xs rounded-xl mb-4 text-center font-semibold">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Submission button */}
              {checkoutStep === "details" ? (
                <button
                  type="button"
                  onClick={handleContinueToPayment}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-widest theme-btn-primary shadow-lg shadow-black/15 transition-all transform active:scale-95 cursor-pointer text-white"
                >
                  <span>Continuar al Pago</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  disabled={isProcessing}
                  onClick={handleSubmitOrder}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-widest theme-btn-primary shadow-lg shadow-black/15 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>{paymentMethod === "mercadopago" ? "Iniciando Mercado Pago..." : "Procesando..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{paymentMethod === "mercadopago" ? "Pagar con Mercado Pago" : "Realizar Pedido vía WhatsApp"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
              
              {isProcessing && paymentMethod === "mercadopago" && (
                <div id="mp-redirect-warning" className="p-3.5 bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-450 rounded-xl text-center text-xs font-bold mt-3 animate-pulse">
                  🔒 Serás redirigido al entorno seguro de Mercado Pago para completar tu compra.
                </div>
              )}

              <p className="text-center text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-3.5 leading-normal">
                Proceso seguro e inmediato. Toda la información personal y datos bancarios están protegidos.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Address Management Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md p-6 rounded-2xl border ${
              isDark ? "bg-zinc-905 border-zinc-800 text-white shadow-2xl" : "bg-white border-gray-250 text-zinc-900 shadow-xl"
            }`}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-dashed border-zinc-800/60 mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-sky-400" />
                {modalMode === "add" ? "Agregar nueva dirección" : "Editar dirección"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800/40 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const isMvd = modalDept === "Montevideo";
                
                if (isMvd) {
                  if (!modalStreet.trim()) {
                    setModalError("Por favor, ingresa la calle.");
                    return;
                  }
                  if (!modalDoorNumber.trim()) {
                    setModalError("Por favor, ingresa el número de puerta.");
                    return;
                  }
                } else {
                  const hasStr = !!modalStreet.trim();
                  const hasDoor = !!modalDoorNumber.trim();
                  const hasSlMz = !!modalSolar.trim() && !!modalManzana.trim();
                  if (!hasStr && !hasSlMz) {
                    setModalError("Por favor, ingresa la calle o, en su defecto, la Manzana y Solar correspondientes.");
                    return;
                  }
                  if (!hasDoor && !hasSlMz) {
                    setModalError("Por favor, ingresa el número de puerta, o la Manzana y el Solar de entrega.");
                    return;
                  }
                }

                if (modalMode === "add") {
                  const newId = `address-${Date.now()}`;
                  const newAddr: AddressItem = {
                    id: newId,
                    dept: modalDept,
                    zone: modalZone,
                    street: modalStreet,
                    doorNumber: modalDoorNumber,
                    apartment: modalApartment || undefined,
                    solar: modalDept !== "Montevideo" ? (modalSolar || undefined) : undefined,
                    manzana: modalDept !== "Montevideo" ? (modalManzana || undefined) : undefined
                  };
                  setAddresses([...addresses, newAddr]);
                  setSelectedAddressId(newId);
                } else if (modalMode === "edit" && editingAddressId) {
                  setAddresses(addresses.map(a => a.id === editingAddressId ? {
                    id: editingAddressId,
                    dept: modalDept,
                    zone: modalZone,
                    street: modalStreet,
                    doorNumber: modalDoorNumber,
                    apartment: modalApartment || undefined,
                    solar: modalDept !== "Montevideo" ? (modalSolar || undefined) : undefined,
                    manzana: modalDept !== "Montevideo" ? (modalManzana || undefined) : undefined
                  } : a));
                }

                setIsAddressModalOpen(false);
              }}
              className="space-y-4"
            >
              {modalError && (
                <div className="p-2.5 rounded-lg bg-red-950/25 border border-red-900 text-red-100 text-xs font-semibold font-mono">
                  ⚠️ {modalError}
                </div>
              )}

              {/* Department field */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5 text-zinc-400">
                  Departamento
                </label>
                <select
                  value={modalDept}
                  onChange={(e) => {
                    const nextDept = e.target.value;
                    setModalDept(nextDept);
                    const defaultZones = DEPT_ZONES[nextDept];
                    if (defaultZones && defaultZones.length > 0) {
                      setModalZone(defaultZones[0]);
                    } else {
                      setModalZone("");
                    }
                  }}
                  className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-sans ${
                    isDark
                      ? "bg-zinc-950 border-zinc-800 text-white"
                      : "bg-white border-gray-300 text-zinc-900 shadow-inner"
                  }`}
                >
                  {Object.keys(DEPT_ZONES).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="Otro">Otro departamento del Uruguay</option>
                </select>
              </div>

              {/* Zone / Barrio list selection depending on Department */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5 text-zinc-400">
                  Barrio o Zona
                </label>
                {DEPT_ZONES[modalDept] ? (
                  <select
                    value={modalZone}
                    onChange={(e) => setModalZone(e.target.value)}
                    className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-sans ${
                      isDark
                        ? "bg-zinc-950 border-zinc-800 text-white"
                        : "bg-white border-gray-300 text-zinc-900"
                    }`}
                  >
                    {DEPT_ZONES[modalDept].map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    type="text"
                    placeholder="Ej: Paysandú Centro, Colonia del Sacramento..."
                    value={modalZone}
                    onChange={(e) => setModalZone(e.target.value)}
                    className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-sans ${
                      isDark
                        ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650"
                        : "bg-white border-gray-300 text-zinc-900"
                    }`}
                  />
                )}
              </div>

              {/* Solar and Manzana - Only for Outside Montevideo */}
              {modalDept !== "Montevideo" && (
                <div className="grid grid-cols-2 gap-3.5 p-3 rounded-lg bg-sky-950/5 border border-dashed border-sky-950/20 dark:border-sky-500/20">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5 text-sky-400 flex items-center gap-1">
                      Manzana <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 4"
                      value={modalManzana}
                      onChange={(e) => setModalManzana(e.target.value)}
                      className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-sans ${
                        isDark
                          ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650"
                          : "bg-white border-gray-300 text-zinc-900"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5 text-sky-400 flex items-center gap-1">
                      Solar <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 12"
                      value={modalSolar}
                      onChange={(e) => setModalSolar(e.target.value)}
                      className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-sans ${
                        isDark
                          ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650"
                          : "bg-white border-gray-300 text-zinc-900"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Calle principal */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5 text-zinc-400">
                  {modalDept === "Montevideo" ? (
                    <>Calle <span className="text-red-500">*</span></>
                  ) : (
                    "Calle (Opcional si usás Manzana y Solar)"
                  )}
                </label>
                <input
                  required={modalDept === "Montevideo"}
                  type="text"
                  placeholder="Ej: Luis Batlle Berres"
                  value={modalStreet}
                  onChange={(e) => setModalStreet(e.target.value)}
                  className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-sans ${
                    isDark
                      ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650"
                      : "bg-white border-gray-300 text-zinc-900"
                  }`}
                />
              </div>

              {/* Number and Apto */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5 text-zinc-400">
                    {modalDept === "Montevideo" ? (
                      <>Nro. Puerta / Km <span className="text-red-500">*</span></>
                    ) : (
                      "Nro. Puerta / Km (Opcional)"
                    )}
                  </label>
                  <input
                    required={modalDept === "Montevideo"}
                    type="text"
                    placeholder="Ej: 4282"
                    value={modalDoorNumber}
                    onChange={(e) => setModalDoorNumber(e.target.value)}
                    className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-sans ${
                      isDark
                        ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650"
                        : "bg-white border-gray-300 text-zinc-900"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5 text-zinc-455">
                    Apto / Piso / Bloque
                  </label>
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={modalApartment}
                    onChange={(e) => setModalApartment(e.target.value)}
                    className={`w-full text-xs px-3 py-2 rounded-lg border outline-none font-sans ${
                      isDark
                        ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-655"
                        : "bg-white border-gray-300 text-zinc-900"
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3.5 pt-3.5 border-t border-dashed border-zinc-800/40">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide cursor-pointer transition ${
                    isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-gray-100 text-zinc-700 hover:bg-gray-200"
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider theme-btn-primary cursor-pointer transition-all active:scale-95 shadow-md shadow-sky-500/10"
                >
                  Guardar dirección
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
