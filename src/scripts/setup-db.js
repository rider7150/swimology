"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var prisma = new client_1.PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});
function setupDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var email, password, existingUser, hashedPassword, superAdmin, allUsers, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, 9, 11]);
                    console.log("Starting database setup...");
                    // Test connection
                    return [4 /*yield*/, prisma.$connect()];
                case 1:
                    // Test connection
                    _a.sent();
                    console.log("Database connection successful!");
                    email = "super@demo.com";
                    password = "sts131";
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { email: email },
                        })];
                case 2:
                    existingUser = _a.sent();
                    if (!existingUser) return [3 /*break*/, 3];
                    console.log("Super admin already exists:", existingUser);
                    return [3 /*break*/, 6];
                case 3: return [4 /*yield*/, bcryptjs_1.default.hash(password, 10)];
                case 4:
                    hashedPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: email,
                                password: hashedPassword,
                                role: "SUPER_ADMIN",
                                name: "Super Admin",
                            },
                        })];
                case 5:
                    superAdmin = _a.sent();
                    console.log("Super admin created:", superAdmin);
                    _a.label = 6;
                case 6: return [4 /*yield*/, prisma.user.findMany()];
                case 7:
                    allUsers = _a.sent();
                    console.log("\nAll users in database:", allUsers);
                    return [3 /*break*/, 11];
                case 8:
                    error_1 = _a.sent();
                    console.error("Error during database setup:", error_1);
                    if (error_1 instanceof Error) {
                        console.error("Error details:", error_1.message);
                        console.error("Error stack:", error_1.stack);
                    }
                    return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, prisma.$disconnect()];
                case 10:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    });
}
// Run the setup
setupDatabase();
