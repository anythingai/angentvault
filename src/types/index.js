"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketEventType = exports.AnalysisType = exports.PaymentStatus = exports.PaymentType = exports.SubscriptionPlan = exports.TradeStatus = exports.TradeType = exports.StrategyType = exports.RiskLevel = exports.AgentStatus = void 0;
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ACTIVE"] = "active";
    AgentStatus["PAUSED"] = "paused";
    AgentStatus["STOPPED"] = "stopped";
    AgentStatus["ERROR"] = "error";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["CONSERVATIVE"] = "conservative";
    RiskLevel["MODERATE"] = "moderate";
    RiskLevel["AGGRESSIVE"] = "aggressive";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var StrategyType;
(function (StrategyType) {
    StrategyType["MOMENTUM"] = "momentum";
    StrategyType["MEAN_REVERSION"] = "mean_reversion";
    StrategyType["ARBITRAGE"] = "arbitrage";
    StrategyType["SENTIMENT_ANALYSIS"] = "sentiment_analysis";
    StrategyType["DCA"] = "dollar_cost_averaging";
})(StrategyType || (exports.StrategyType = StrategyType = {}));
var TradeType;
(function (TradeType) {
    TradeType["BUY"] = "buy";
    TradeType["SELL"] = "sell";
})(TradeType || (exports.TradeType = TradeType = {}));
var TradeStatus;
(function (TradeStatus) {
    TradeStatus["PENDING"] = "pending";
    TradeStatus["EXECUTED"] = "executed";
    TradeStatus["FAILED"] = "failed";
    TradeStatus["CANCELLED"] = "cancelled";
})(TradeStatus || (exports.TradeStatus = TradeStatus = {}));
var SubscriptionPlan;
(function (SubscriptionPlan) {
    SubscriptionPlan["FREE"] = "free";
    SubscriptionPlan["BASIC"] = "basic";
    SubscriptionPlan["PREMIUM"] = "premium";
    SubscriptionPlan["ENTERPRISE"] = "enterprise";
})(SubscriptionPlan || (exports.SubscriptionPlan = SubscriptionPlan = {}));
var PaymentType;
(function (PaymentType) {
    PaymentType["SUBSCRIPTION"] = "subscription";
    PaymentType["AGENT_ACCESS"] = "agent_access";
    PaymentType["QUERY_FEE"] = "query_fee";
    PaymentType["REVENUE_SHARE"] = "revenue_share";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var AnalysisType;
(function (AnalysisType) {
    AnalysisType["MARKET_SENTIMENT"] = "market_sentiment";
    AnalysisType["PRICE_PREDICTION"] = "price_prediction";
    AnalysisType["RISK_ASSESSMENT"] = "risk_assessment";
    AnalysisType["OPPORTUNITY_DETECTION"] = "opportunity_detection";
})(AnalysisType || (exports.AnalysisType = AnalysisType = {}));
var WebSocketEventType;
(function (WebSocketEventType) {
    WebSocketEventType["AGENT_STATUS_UPDATE"] = "agent_status_update";
    WebSocketEventType["TRADE_EXECUTED"] = "trade_executed";
    WebSocketEventType["MARKET_DATA_UPDATE"] = "market_data_update";
    WebSocketEventType["BALANCE_UPDATE"] = "balance_update";
    WebSocketEventType["PRICE_ALERT"] = "price_alert";
})(WebSocketEventType || (exports.WebSocketEventType = WebSocketEventType = {}));
//# sourceMappingURL=index.js.map