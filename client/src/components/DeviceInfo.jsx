import { Monitor, Smartphone, Shield, AlertTriangle } from 'lucide-react';

const DeviceInfo = ({ deviceInfo }) => {
  if (!deviceInfo) return null;

  const getRiskColor = (score) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskLabel = (score) => {
    if (score >= 70) return 'High Risk';
    if (score >= 40) return 'Medium Risk';
    return 'Low Risk';
  };

  return (
    <div className="bg-white/5 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Device Information
        </h4>
        {deviceInfo.riskScore > 0 && (
          <span className={`text-sm font-semibold ${getRiskColor(deviceInfo.riskScore)}`}>
            {getRiskLabel(deviceInfo.riskScore)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-400">Browser:</span>
          <p className="text-white">{deviceInfo.browser || 'Unknown'}</p>
        </div>
        <div>
          <span className="text-gray-400">OS:</span>
          <p className="text-white">{deviceInfo.os || 'Unknown'}</p>
        </div>
        <div>
          <span className="text-gray-400">Platform:</span>
          <p className="text-white flex items-center gap-1">
            {deviceInfo.platform === 'Mobile' ? (
              <Smartphone className="w-3 h-3" />
            ) : (
              <Monitor className="w-3 h-3" />
            )}
            {deviceInfo.platform || 'Unknown'}
          </p>
        </div>
        <div>
          <span className="text-gray-400">IP:</span>
          <p className="text-white text-xs">{deviceInfo.ip || 'N/A'}</p>
        </div>
      </div>

      {(deviceInfo.isProxy || deviceInfo.isVPN || deviceInfo.isTor) && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-semibold text-sm">Security Alert</p>
              <div className="text-xs text-gray-300 mt-1 space-y-1">
                {deviceInfo.isProxy && <p>• Proxy detected</p>}
                {deviceInfo.isVPN && <p>• VPN detected</p>}
                {deviceInfo.isTor && <p>• Tor network detected</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400">
        Fingerprint: {deviceInfo.deviceFingerprint?.substring(0, 16)}...
      </div>
    </div>
  );
};

export default DeviceInfo;
