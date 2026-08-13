import os
import json
import numpy as np
from flask import Flask, request, jsonify
from sklearn.ensemble import IsolationForest

app = Flask(__name__)

# Initialize and fit IsolationForest model on baseline synthetic telemetry
# Features: [failed_logins, failed_otps, unauthorized_accesses, break_glass_requests, lookup_frequency_per_hr]
np.random.seed(42)
normal_behavior = np.random.uniform(low=[0, 0, 0, 0, 1], high=[1, 1, 0, 0, 10], size=(200, 5))
suspicious_behavior = np.random.uniform(low=[2, 2, 2, 1, 20], high=[5, 5, 5, 3, 50], size=(30, 5))
training_data = np.vstack([normal_behavior, suspicious_behavior])

model = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
model.fit(training_data)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "CyberCare ML Anomaly Detector", "version": "1.0.0"})

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json() or {}
        failed_logins = int(data.get('failed_logins', 0))
        failed_otps = int(data.get('failed_otps', 0))
        unauthorized_attempts = int(data.get('unauthorized_attempts', 0))
        break_glass_count = int(data.get('break_glass_count', 0))
        lookup_frequency = int(data.get('lookup_frequency', 1))

        feature_vector = np.array([[failed_logins, failed_otps, unauthorized_attempts, break_glass_count, lookup_frequency]])
        
        # Decision function returns anomaly score (negative means anomaly)
        raw_score = float(model.decision_function(feature_vector)[0])
        is_anomaly = int(model.predict(feature_vector)[0]) == -1

        # Map to 0 - 100 risk score
        # raw_score typically ranges between -0.3 (extreme anomaly) and +0.3 (very normal)
        normalized_risk = int(np.clip((0.2 - raw_score) * 160 + (unauthorized_attempts * 15) + (failed_otps * 12) + (break_glass_count * 10), 0, 100))

        if normalized_risk <= 30:
            classification = "LOW"
        elif normalized_risk <= 60:
            classification = "MEDIUM"
        elif normalized_risk <= 80:
            classification = "HIGH"
        else:
            classification = "CRITICAL"

        reasons = []
        if failed_logins > 1:
            reasons.append(f"Multiple failed password authentication attempts ({failed_logins})")
        if failed_otps > 0:
            reasons.append(f"Unverified or expired 2FA OTP codes ({failed_otps})")
        if unauthorized_attempts > 0:
            reasons.append(f"Repeated unauthorized access attempts to cross-department patient records ({unauthorized_attempts})")
        if break_glass_count > 0:
            reasons.append(f"Emergency Break-Glass access active/requested ({break_glass_count})")
        if lookup_frequency > 15:
            reasons.append(f"Unusual high-frequency patient record query rate ({lookup_frequency}/hr)")
        if not reasons:
            reasons.append("Standard operational access pattern detected")

        return jsonify({
            "riskScore": normalized_risk,
            "classification": classification,
            "isAnomaly": is_anomaly,
            "rawScore": raw_score,
            "explainableReasons": reasons,
            "recommendation": "Account lock recommended" if classification == "CRITICAL" else ("Enhanced audit monitoring" if classification in ["MEDIUM", "HIGH"] else "No action required")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    print(f"[*] CyberCare ML Anomaly Detector Service running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
