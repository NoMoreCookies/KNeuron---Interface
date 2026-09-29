import { useDevice } from "../features/device/useDevice";

export function DevicePanel() {
  const { snapshot, streamInfoByDeviceId } = useDevice();

  const activeDevice = snapshot.activeDeviceInfo;

  const activeStatus = snapshot.activeStatus;

  const streamInfo = snapshot.activeDeviceId
    ? streamInfoByDeviceId[snapshot.activeDeviceId]
    : undefined;

  return (
    <aside className="device-panel">
      <div className="device-panel__header">
        <span className="eyebrow">DEVICE</span>

        <h2>Device</h2>
      </div>

      {!activeDevice ? (
        <div className="device-panel__empty">
          <span className="device-panel__dot" />

          <strong>No device connected</strong>

          <p>Select a device from the Device page.</p>
        </div>
      ) : (
        <div className="device-panel__active">
          <div className="device-panel__status">
            <span
              className={`device-panel__dot device-panel__dot--${activeStatus?.state ?? "disconnected"}`}
            />

            <span>{activeStatus?.state ?? "disconnected"}</span>
          </div>

          <strong className="device-panel__name">{activeDevice.name}</strong>

          {activeDevice.model && <span className="device-panel__model">{activeDevice.model}</span>}

          <div className="device-panel__details">
            <div>
              <span>Type</span>

              <strong>{activeDevice.kind}</strong>
            </div>

            {streamInfo && (
              <>
                <div>
                  <span>Rate</span>

                  <strong>{streamInfo.sampleRateHz} Hz</strong>
                </div>

                <div>
                  <span>Channels</span>

                  <strong>{streamInfo.channels.length}</strong>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
