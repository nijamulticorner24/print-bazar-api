import { OperationsService, OperationsDashboardFilters, AssignDesignerDto, AssignProductionOperatorDto, CreateOperationalNoteDto, UpdatePriorityDto, ReleaseToProductionDto } from './operations.service';
import { JwtPayload } from '../../common/types/roles';
export declare class OperationsController {
    private readonly operationsService;
    constructor(operationsService: OperationsService);
    getDashboard(): Promise<{
        totalActive: number;
        unassignedOrders: number;
        newIntakeOrders: number;
        designPending: number;
        productionPending: number;
        qcPending: number;
        paymentBlocked: number;
        packingReady: number;
        dispatchReady: number;
        onHold: number;
        atRiskOverdue: number;
        unassignedDesign: number;
        unassignedProduction: number;
        statusBreakdown: Record<string, number>;
    }>;
    listOrders(query: OperationsDashboardFilters): Promise<{
        data: {
            nextAction: import("./operations.service").OperationalNextAction;
            blockers: import("./operations.service").OperationalBlocker[];
            designAssignment: {
                id: string;
                taskType: import(".prisma/client").$Enums.AssignmentTaskType;
                assignedAt: Date;
                assignedUser: {
                    id: string;
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                };
            } | null;
            productionAssignment: {
                id: string;
                taskType: import(".prisma/client").$Enums.AssignmentTaskType;
                assignedAt: Date;
                assignedUser: {
                    id: string;
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                };
            } | null;
            assignedDesigner: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            } | null;
            assignedOperator: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            } | null;
            id: string;
            createdAt: Date;
            customer: {
                phone: string;
                id: string;
                email: string;
                fullName: string;
                companyName: string | null;
            };
            jobCards: {
                id: string;
                status: import(".prisma/client").$Enums.JobCardStatus;
                jobNumber: string;
                currentStation: string;
                operatorId: string | null;
            }[];
            status: import(".prisma/client").$Enums.OrderStatus;
            orderNumber: string;
            customerStatus: import(".prisma/client").$Enums.CustomerVisibleStatus;
            deliveryMethod: import(".prisma/client").$Enums.DeliveryMethod;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal;
            balanceAmount: import("@prisma/client/runtime/library").Decimal;
            paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
            priority: import(".prisma/client").$Enums.Priority;
            slaStatus: import(".prisma/client").$Enums.SlaStatus;
            dueAt: Date | null;
            items: {
                id: string;
                artworkVersions: {
                    id: string;
                    status: import(".prisma/client").$Enums.ArtworkStatus;
                    versionNumber: number;
                    storageKey: string;
                    originalFileName: string;
                    mimeType: string;
                    fileSize: number;
                    widthPixels: number | null;
                    heightPixels: number | null;
                    qualityStatus: string | null;
                    proofUrl: string | null;
                    isApproved: boolean;
                }[];
                approvedArtworkVersionId: string | null;
                productName: string;
                quantity: number;
                specifications: import("@prisma/client/runtime/library").JsonValue;
            }[];
            packages: {
                id: string;
                status: import(".prisma/client").$Enums.PackageStatus;
            }[];
            qcChecklists: {
                id: string;
                type: import(".prisma/client").$Enums.QCInspectionType;
                outcome: import(".prisma/client").$Enums.QCOutcome;
            }[];
            assignments: {
                id: string;
                taskType: import(".prisma/client").$Enums.AssignmentTaskType;
                assignedAt: Date;
                assignedUser: {
                    id: string;
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                };
            }[];
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    intakeOrders(query: OperationsDashboardFilters): Promise<{
        data: {
            nextAction: import("./operations.service").OperationalNextAction;
            blockers: import("./operations.service").OperationalBlocker[];
            designAssignment: {
                id: string;
                taskType: import(".prisma/client").$Enums.AssignmentTaskType;
                assignedAt: Date;
                assignedUser: {
                    id: string;
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                };
            } | null;
            productionAssignment: {
                id: string;
                taskType: import(".prisma/client").$Enums.AssignmentTaskType;
                assignedAt: Date;
                assignedUser: {
                    id: string;
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                };
            } | null;
            assignedDesigner: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            } | null;
            assignedOperator: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            } | null;
            id: string;
            createdAt: Date;
            customer: {
                phone: string;
                id: string;
                email: string;
                fullName: string;
                companyName: string | null;
            };
            jobCards: {
                id: string;
                status: import(".prisma/client").$Enums.JobCardStatus;
                jobNumber: string;
                currentStation: string;
                operatorId: string | null;
            }[];
            status: import(".prisma/client").$Enums.OrderStatus;
            orderNumber: string;
            customerStatus: import(".prisma/client").$Enums.CustomerVisibleStatus;
            deliveryMethod: import(".prisma/client").$Enums.DeliveryMethod;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal;
            balanceAmount: import("@prisma/client/runtime/library").Decimal;
            paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
            priority: import(".prisma/client").$Enums.Priority;
            slaStatus: import(".prisma/client").$Enums.SlaStatus;
            dueAt: Date | null;
            items: {
                id: string;
                artworkVersions: {
                    id: string;
                    status: import(".prisma/client").$Enums.ArtworkStatus;
                    versionNumber: number;
                    storageKey: string;
                    originalFileName: string;
                    mimeType: string;
                    fileSize: number;
                    widthPixels: number | null;
                    heightPixels: number | null;
                    qualityStatus: string | null;
                    proofUrl: string | null;
                    isApproved: boolean;
                }[];
                approvedArtworkVersionId: string | null;
                productName: string;
                quantity: number;
                specifications: import("@prisma/client/runtime/library").JsonValue;
            }[];
            packages: {
                id: string;
                status: import(".prisma/client").$Enums.PackageStatus;
            }[];
            qcChecklists: {
                id: string;
                type: import(".prisma/client").$Enums.QCInspectionType;
                outcome: import(".prisma/client").$Enums.QCOutcome;
            }[];
            assignments: {
                id: string;
                taskType: import(".prisma/client").$Enums.AssignmentTaskType;
                assignedAt: Date;
                assignedUser: {
                    id: string;
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                };
            }[];
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    unassignedDesign(query: OperationsDashboardFilters): Promise<{
        data: {
            nextAction: import("./operations.service").OperationalNextAction;
            blockers: import("./operations.service").OperationalBlocker[];
            designAssignment: {
                id: string;
                taskType: import(".prisma/client").$Enums.AssignmentTaskType;
                assignedAt: Date;
                assignedUser: {
                    id: string;
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                };
            } | null;
            productionAssignment: {
                id: string;
                taskType: import(".prisma/client").$Enums.AssignmentTaskType;
                assignedAt: Date;
                assignedUser: {
                    id: string;
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                };
            } | null;
            assignedDesigner: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            } | null;
            assignedOperator: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            } | null;
            id: string;
            createdAt: Date;
            customer: {
                phone: string;
                id: string;
                email: string;
                fullName: string;
                companyName: string | null;
            };
            jobCards: {
                id: string;
                status: import(".prisma/client").$Enums.JobCardStatus;
                jobNumber: string;
                currentStation: string;
                operatorId: string | null;
            }[];
            status: import(".prisma/client").$Enums.OrderStatus;
            orderNumber: string;
            customerStatus: import(".prisma/client").$Enums.CustomerVisibleStatus;
            deliveryMethod: import(".prisma/client").$Enums.DeliveryMethod;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal;
            balanceAmount: import("@prisma/client/runtime/library").Decimal;
            paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
            priority: import(".prisma/client").$Enums.Priority;
            slaStatus: import(".prisma/client").$Enums.SlaStatus;
            dueAt: Date | null;
            items: {
                id: string;
                artworkVersions: {
                    id: string;
                    status: import(".prisma/client").$Enums.ArtworkStatus;
                    versionNumber: number;
                    storageKey: string;
                    originalFileName: string;
                    mimeType: string;
                    fileSize: number;
                    widthPixels: number | null;
                    heightPixels: number | null;
                    qualityStatus: string | null;
                    proofUrl: string | null;
                    isApproved: boolean;
                }[];
                approvedArtworkVersionId: string | null;
                productName: string;
                quantity: number;
                specifications: import("@prisma/client/runtime/library").JsonValue;
            }[];
            packages: {
                id: string;
                status: import(".prisma/client").$Enums.PackageStatus;
            }[];
            qcChecklists: {
                id: string;
                type: import(".prisma/client").$Enums.QCInspectionType;
                outcome: import(".prisma/client").$Enums.QCOutcome;
            }[];
            assignments: {
                id: string;
                taskType: import(".prisma/client").$Enums.AssignmentTaskType;
                assignedAt: Date;
                assignedUser: {
                    id: string;
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                };
            }[];
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    unassignedProduction(query: OperationsDashboardFilters): Promise<{
        data: {
            nextAction: import("./operations.service").OperationalNextAction;
            blockers: import("./operations.service").OperationalBlocker[];
            designAssignment: {
                id: string;
                taskType: import(".prisma/client").$Enums.AssignmentTaskType;
                assignedAt: Date;
                assignedUser: {
                    id: string;
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                };
            } | null;
            productionAssignment: {
                id: string;
                taskType: import(".prisma/client").$Enums.AssignmentTaskType;
                assignedAt: Date;
                assignedUser: {
                    id: string;
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                };
            } | null;
            assignedDesigner: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            } | null;
            assignedOperator: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            } | null;
            id: string;
            createdAt: Date;
            customer: {
                phone: string;
                id: string;
                email: string;
                fullName: string;
                companyName: string | null;
            };
            jobCards: {
                id: string;
                status: import(".prisma/client").$Enums.JobCardStatus;
                jobNumber: string;
                currentStation: string;
                operatorId: string | null;
            }[];
            status: import(".prisma/client").$Enums.OrderStatus;
            orderNumber: string;
            customerStatus: import(".prisma/client").$Enums.CustomerVisibleStatus;
            deliveryMethod: import(".prisma/client").$Enums.DeliveryMethod;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal;
            balanceAmount: import("@prisma/client/runtime/library").Decimal;
            paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
            priority: import(".prisma/client").$Enums.Priority;
            slaStatus: import(".prisma/client").$Enums.SlaStatus;
            dueAt: Date | null;
            items: {
                id: string;
                artworkVersions: {
                    id: string;
                    status: import(".prisma/client").$Enums.ArtworkStatus;
                    versionNumber: number;
                    storageKey: string;
                    originalFileName: string;
                    mimeType: string;
                    fileSize: number;
                    widthPixels: number | null;
                    heightPixels: number | null;
                    qualityStatus: string | null;
                    proofUrl: string | null;
                    isApproved: boolean;
                }[];
                approvedArtworkVersionId: string | null;
                productName: string;
                quantity: number;
                specifications: import("@prisma/client/runtime/library").JsonValue;
            }[];
            packages: {
                id: string;
                status: import(".prisma/client").$Enums.PackageStatus;
            }[];
            qcChecklists: {
                id: string;
                type: import(".prisma/client").$Enums.QCInspectionType;
                outcome: import(".prisma/client").$Enums.QCOutcome;
            }[];
            assignments: {
                id: string;
                taskType: import(".prisma/client").$Enums.AssignmentTaskType;
                assignedAt: Date;
                assignedUser: {
                    id: string;
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                };
            }[];
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    blockedOrders(query: OperationsDashboardFilters): Promise<{
        data: {
            nextAction: import("./operations.service").OperationalNextAction;
            blockers: import("./operations.service").OperationalBlocker[];
            designAssignment: {
                id: string;
                taskType: import(".prisma/client").$Enums.AssignmentTaskType;
                assignedAt: Date;
                assignedUser: {
                    id: string;
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                };
            } | null;
            productionAssignment: {
                id: string;
                taskType: import(".prisma/client").$Enums.AssignmentTaskType;
                assignedAt: Date;
                assignedUser: {
                    id: string;
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                };
            } | null;
            assignedDesigner: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            } | null;
            assignedOperator: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            } | null;
            id: string;
            createdAt: Date;
            customer: {
                phone: string;
                id: string;
                email: string;
                fullName: string;
                companyName: string | null;
            };
            jobCards: {
                id: string;
                status: import(".prisma/client").$Enums.JobCardStatus;
                jobNumber: string;
                currentStation: string;
                operatorId: string | null;
            }[];
            status: import(".prisma/client").$Enums.OrderStatus;
            orderNumber: string;
            customerStatus: import(".prisma/client").$Enums.CustomerVisibleStatus;
            deliveryMethod: import(".prisma/client").$Enums.DeliveryMethod;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            paidAmount: import("@prisma/client/runtime/library").Decimal;
            balanceAmount: import("@prisma/client/runtime/library").Decimal;
            paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
            priority: import(".prisma/client").$Enums.Priority;
            slaStatus: import(".prisma/client").$Enums.SlaStatus;
            dueAt: Date | null;
            items: {
                id: string;
                artworkVersions: {
                    id: string;
                    status: import(".prisma/client").$Enums.ArtworkStatus;
                    versionNumber: number;
                    storageKey: string;
                    originalFileName: string;
                    mimeType: string;
                    fileSize: number;
                    widthPixels: number | null;
                    heightPixels: number | null;
                    qualityStatus: string | null;
                    proofUrl: string | null;
                    isApproved: boolean;
                }[];
                approvedArtworkVersionId: string | null;
                productName: string;
                quantity: number;
                specifications: import("@prisma/client/runtime/library").JsonValue;
            }[];
            packages: {
                id: string;
                status: import(".prisma/client").$Enums.PackageStatus;
            }[];
            qcChecklists: {
                id: string;
                type: import(".prisma/client").$Enums.QCInspectionType;
                outcome: import(".prisma/client").$Enums.QCOutcome;
            }[];
            assignments: {
                id: string;
                taskType: import(".prisma/client").$Enums.AssignmentTaskType;
                assignedAt: Date;
                assignedUser: {
                    id: string;
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                };
            }[];
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getOrderDetail(id: string): Promise<{
        nextAction: import("./operations.service").OperationalNextAction;
        blockers: import("./operations.service").OperationalBlocker[];
        activeDesignAssignment: ({
            assignedUser: {
                id: string;
                email: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
                department: import(".prisma/client").$Enums.Department | null;
            };
            assignedByUser: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.AssignmentStatus;
            orderId: string;
            completedAt: Date | null;
            taskType: import(".prisma/client").$Enums.AssignmentTaskType;
            assignedUserId: string;
            assignedByUserId: string;
            assignedAt: Date;
            reason: string | null;
        }) | null;
        activeProductionAssignment: ({
            assignedUser: {
                id: string;
                email: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
                department: import(".prisma/client").$Enums.Department | null;
            };
            assignedByUser: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.AssignmentStatus;
            orderId: string;
            completedAt: Date | null;
            taskType: import(".prisma/client").$Enums.AssignmentTaskType;
            assignedUserId: string;
            assignedByUserId: string;
            assignedAt: Date;
            reason: string | null;
        }) | null;
        assignmentHistory: ({
            assignedUser: {
                id: string;
                email: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
                department: import(".prisma/client").$Enums.Department | null;
            };
            assignedByUser: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.AssignmentStatus;
            orderId: string;
            completedAt: Date | null;
            taskType: import(".prisma/client").$Enums.AssignmentTaskType;
            assignedUserId: string;
            assignedByUserId: string;
            assignedAt: Date;
            reason: string | null;
        })[];
        operationalNotes: {
            id: string;
            createdAt: Date;
            orderId: string;
            content: string;
            authorId: string;
            authorName: string;
            authorRole: import(".prisma/client").$Enums.UserRole;
        }[];
        customer: {
            addresses: {
                phone: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                type: string;
                isDefault: boolean;
                customerId: string;
                contactName: string;
                street: string;
                landmark: string | null;
                city: string;
                state: string;
                postalCode: string;
                country: string;
            }[];
        } & {
            phone: string;
            id: string;
            email: string;
            fullName: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            companyName: string | null;
            gstin: string | null;
        };
        shippingAddress: {
            phone: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            isDefault: boolean;
            customerId: string;
            contactName: string;
            street: string;
            landmark: string | null;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        } | null;
        billingAddress: {
            phone: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            isDefault: boolean;
            customerId: string;
            contactName: string;
            street: string;
            landmark: string | null;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        } | null;
        items: ({
            jobCards: ({
                operator: {
                    id: string;
                    fullName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                } | null;
                machine: {
                    id: string;
                    name: string;
                    code: string;
                    type: string;
                } | null;
                issues: {
                    id: string;
                    createdAt: Date;
                    description: string;
                    jobCardId: string;
                    reasonCode: string;
                    reportedBy: string;
                    isResolved: boolean;
                    resolvedBy: string | null;
                    resolvedAt: Date | null;
                }[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.JobCardStatus;
                priority: import(".prisma/client").$Enums.Priority;
                dueAt: Date;
                orderId: string;
                jobNumber: string;
                orderItemId: string;
                approvedArtworkVersionId: string | null;
                preHoldStatus: import(".prisma/client").$Enums.JobCardStatus | null;
                currentStation: string;
                machineId: string | null;
                operatorId: string | null;
                operationSequence: import("@prisma/client/runtime/library").JsonValue;
                technicalSpecs: import("@prisma/client/runtime/library").JsonValue;
                startedAt: Date | null;
                completedAt: Date | null;
            })[];
            product: {
                id: string;
                name: string;
                slug: string;
                sku: string;
            };
            artworkVersions: {
                id: string;
                createdAt: Date;
                status: import(".prisma/client").$Enums.ArtworkStatus;
                customerNotes: string | null;
                orderItemId: string;
                versionNumber: number;
                storageKey: string;
                originalFileName: string;
                mimeType: string;
                fileSize: number;
                checksum: string;
                resolutionDpi: number | null;
                widthMm: import("@prisma/client/runtime/library").Decimal | null;
                heightMm: import("@prisma/client/runtime/library").Decimal | null;
                widthPixels: number | null;
                heightPixels: number | null;
                actualMegapixels: number | null;
                qualityStatus: string | null;
                warningAccepted: boolean;
                hasBleed: boolean | null;
                colorProfile: string | null;
                proofUrl: string | null;
                isApproved: boolean;
                prepressNotes: string | null;
                uploadedBy: string;
                approvedAt: Date | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sku: string;
            productId: string;
            orderId: string;
            approvedArtworkVersionId: string | null;
            productName: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            specifications: import("@prisma/client/runtime/library").JsonValue;
            designNotes: string | null;
        })[];
        payments: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            transactionId: string;
            method: import(".prisma/client").$Enums.PaymentMethod;
            amount: import("@prisma/client/runtime/library").Decimal;
            capturedAt: Date | null;
        }[];
        invoices: {
            id: string;
            grandTotal: import("@prisma/client/runtime/library").Decimal;
            invoiceNumber: string;
            pdfUrl: string | null;
            issuedAt: Date;
        }[];
        packages: ({
            shipment: {
                id: string;
                status: import(".prisma/client").$Enums.ShipmentStatus;
                shipmentNumber: string;
                courierName: string;
                awbNumber: string;
                trackingUrl: string | null;
                dispatchedAt: Date | null;
                deliveredAt: Date | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PackageStatus;
            orderId: string;
            packageNumber: string;
            sequenceNumber: number;
            totalPackages: number;
            grossWeightGrams: number;
            lengthCm: import("@prisma/client/runtime/library").Decimal;
            widthCm: import("@prisma/client/runtime/library").Decimal;
            heightCm: import("@prisma/client/runtime/library").Decimal;
            labelUrl: string | null;
            barcode: string;
            shipmentId: string | null;
        })[];
        statusHistory: ({
            changedBy: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            } | null;
        } & {
            id: string;
            department: import(".prisma/client").$Enums.Department | null;
            createdAt: Date;
            notes: string | null;
            orderId: string;
            reason: string | null;
            fromStatus: import(".prisma/client").$Enums.OrderStatus | null;
            toStatus: import(".prisma/client").$Enums.OrderStatus;
            durationMinutes: number | null;
            changedById: string | null;
        })[];
        slaRecords: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orderId: string;
            jobCardId: string | null;
            entityType: string;
            currentStatus: import(".prisma/client").$Enums.SlaStatus;
            targetDueAt: Date;
            isBreached: boolean;
            escalatedTo: string | null;
        }[];
        qcChecklists: ({
            inspector: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.QCInspectionType;
            notes: string | null;
            items: import("@prisma/client/runtime/library").JsonValue;
            orderId: string;
            jobCardId: string | null;
            outcome: import(".prisma/client").$Enums.QCOutcome;
            inspectorId: string;
            defects: import(".prisma/client").$Enums.DefectCategory[];
        })[];
        assignments: ({
            assignedUser: {
                id: string;
                email: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
                department: import(".prisma/client").$Enums.Department | null;
            };
            assignedByUser: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.AssignmentStatus;
            orderId: string;
            completedAt: Date | null;
            taskType: import(".prisma/client").$Enums.AssignmentTaskType;
            assignedUserId: string;
            assignedByUserId: string;
            assignedAt: Date;
            reason: string | null;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        orderNumber: string;
        customerId: string;
        sourceChannel: import(".prisma/client").$Enums.OrderChannel;
        customerStatus: import(".prisma/client").$Enums.CustomerVisibleStatus;
        deliveryMethod: import(".prisma/client").$Enums.DeliveryMethod;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        taxAmount: import("@prisma/client/runtime/library").Decimal;
        shippingAmount: import("@prisma/client/runtime/library").Decimal;
        discountAmount: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
        balanceAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        priority: import(".prisma/client").$Enums.Priority;
        slaStatus: import(".prisma/client").$Enums.SlaStatus;
        dueAt: Date | null;
        customerNotes: string | null;
        internalNotes: string | null;
        shippingAddressId: string | null;
        billingAddressId: string | null;
    }>;
    getTimeline(id: string): Promise<{
        statusHistory: ({
            changedBy: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            } | null;
        } & {
            id: string;
            department: import(".prisma/client").$Enums.Department | null;
            createdAt: Date;
            notes: string | null;
            orderId: string;
            reason: string | null;
            fromStatus: import(".prisma/client").$Enums.OrderStatus | null;
            toStatus: import(".prisma/client").$Enums.OrderStatus;
            durationMinutes: number | null;
            changedById: string | null;
        })[];
        auditLogs: ({
            actor: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            orderId: string | null;
            reason: string | null;
            actorType: string;
            action: string;
            entity: string;
            entityId: string;
            previousState: import("@prisma/client/runtime/library").JsonValue | null;
            newState: import("@prisma/client/runtime/library").JsonValue | null;
            ipAddress: string | null;
            userAgent: string | null;
            actorId: string | null;
        })[];
        assignments: ({
            assignedUser: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
            assignedByUser: {
                id: string;
                fullName: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.AssignmentStatus;
            orderId: string;
            completedAt: Date | null;
            taskType: import(".prisma/client").$Enums.AssignmentTaskType;
            assignedUserId: string;
            assignedByUserId: string;
            assignedAt: Date;
            reason: string | null;
        })[];
        notes: {
            id: string;
            createdAt: Date;
            orderId: string;
            content: string;
            authorId: string;
            authorName: string;
            authorRole: import(".prisma/client").$Enums.UserRole;
        }[];
    }>;
    assignDesigner(id: string, body: AssignDesignerDto, user: JwtPayload): Promise<{
        assignedUser: {
            id: string;
            email: string;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        assignedByUser: {
            id: string;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.AssignmentStatus;
        orderId: string;
        completedAt: Date | null;
        taskType: import(".prisma/client").$Enums.AssignmentTaskType;
        assignedUserId: string;
        assignedByUserId: string;
        assignedAt: Date;
        reason: string | null;
    }>;
    assignProductionOperator(id: string, body: AssignProductionOperatorDto, user: JwtPayload): Promise<{
        assignedUser: {
            id: string;
            email: string;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        assignedByUser: {
            id: string;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.AssignmentStatus;
        orderId: string;
        completedAt: Date | null;
        taskType: import(".prisma/client").$Enums.AssignmentTaskType;
        assignedUserId: string;
        assignedByUserId: string;
        assignedAt: Date;
        reason: string | null;
    }>;
    addNote(id: string, body: CreateOperationalNoteDto, user: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        orderId: string;
        content: string;
        authorId: string;
        authorName: string;
        authorRole: import(".prisma/client").$Enums.UserRole;
    }>;
    updatePriority(id: string, body: UpdatePriorityDto, user: JwtPayload): Promise<{
        id: string;
        orderNumber: string;
        priority: import(".prisma/client").$Enums.Priority;
    }>;
    getDesigners(): Promise<{
        id: string;
        fullName: string;
        email: string;
        department: import(".prisma/client").$Enums.Department | null;
        isActive: boolean;
        activeAssignments: number;
    }[]>;
    getOperators(): Promise<{
        id: string;
        fullName: string;
        email: string;
        department: import(".prisma/client").$Enums.Department | null;
        isActive: boolean;
        activeJobCards: number;
        activeAssignments: number;
    }[]>;
    getOrderReadiness(id: string): Promise<import("./operations.service").OrderReadinessReport>;
    releaseToProduction(id: string, body: ReleaseToProductionDto, user: JwtPayload): Promise<{
        success: boolean;
        orderId: string;
        orderNumber: string;
        status: "PRODUCTION_QUEUE";
        sizeValidation: import("./operations.service").SizeValidationResult;
        jobCards: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.JobCardStatus;
            priority: import(".prisma/client").$Enums.Priority;
            dueAt: Date;
            orderId: string;
            jobNumber: string;
            orderItemId: string;
            approvedArtworkVersionId: string | null;
            preHoldStatus: import(".prisma/client").$Enums.JobCardStatus | null;
            currentStation: string;
            machineId: string | null;
            operatorId: string | null;
            operationSequence: import("@prisma/client/runtime/library").JsonValue;
            technicalSpecs: import("@prisma/client/runtime/library").JsonValue;
            startedAt: Date | null;
            completedAt: Date | null;
        }[];
        releasedBy: string;
    }>;
}
