export declare class UpdateShippingGstSettingsDto {
    baseShippingFee: number;
    gstRate: number;
    freeShippingThreshold: number;
    isFreeShippingEnabled: boolean;
}
export declare class CreateShippingZoneDto {
    zoneName: string;
    pincodePrefix: string;
    shippingCharge: number;
    isActive?: boolean;
}
export declare class UpdateShippingZoneDto {
    zoneName?: string;
    pincodePrefix?: string;
    shippingCharge?: number;
    isActive?: boolean;
}
export declare class CalculateShippingAndTaxDto {
    subtotal: number;
    postalCode?: string;
    deliveryMethod?: 'COURIER' | 'STORE_PICKUP';
    isInterState?: boolean;
}
