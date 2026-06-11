import Bonjour from 'bonjour-service';
import { SlaveDeviceService } from '../../modules/slaveDevices/slaveDevice.service';
import { SlaveDevice } from '../../modules/slaveDevices/slaveDevice.model';

export class MdnsDiscoveryService {
  private static bonjour: Bonjour | null = null;
  private static cleanupInterval: NodeJS.Timeout | null = null;
  private static publishInterval: NodeJS.Timeout | null = null;
  private static OFFLINE_TIMEOUT_MS = 90 * 1000;
  private static CLEANUP_INTERVAL_MS = 30 * 1000;

  /**
   * Starts the mDNS discovery scan and periodic database cleanup.
   */
  public static startDiscovery(): void {
    if (this.bonjour) {
      console.log('[mDNS] Discovery service is already running.');
      return;
    }

    this.bonjour = new Bonjour();
    console.log('[mDNS] Bonjour scanner initialized.');

    // 1. Browse for standard HTTP services
    const httpBrowser = this.bonjour.find({ type: 'http' });
    httpBrowser.on('up', this.handleDeviceUp.bind(this));
    httpBrowser.on('down', this.handleDeviceDown.bind(this));

    // 2. Browse for custom Siren services
    const sirenBrowser = this.bonjour.find({ type: 'siren' });
    sirenBrowser.on('up', this.handleDeviceUp.bind(this));
    sirenBrowser.on('down', this.handleDeviceDown.bind(this));

    console.log('[mDNS] Scanning for "http" and "siren" service advertisements...');

    // 3. Publish local service (advertise this SBC server)
    const publishName = process.env.MDNS_PUBLISH_NAME || 'SBC-server';
    const publishType = process.env.MDNS_PUBLISH_TYPE || 'server';
    const publishProtocol = (process.env.MDNS_PUBLISH_PROTOCOL || 'tcp') as 'tcp' | 'udp';
    const publishPort = parseInt(process.env.MDNS_PUBLISH_PORT || '80', 10);

    const publishService = () => {
      if (!this.bonjour) return;
      try {
        this.bonjour.publish({
          name: publishName,
          type: publishType,
          protocol: publishProtocol,
          port: publishPort
        });
      } catch (error) {
        console.error('[mDNS] Error publishing local service:', error);
      }
    };

    publishService();
    console.log("MDNS Initalized");

    this.publishInterval = setInterval(() => {
      if (!this.bonjour) return;
      this.bonjour.unpublishAll(() => {
        console.log("Refreshing");
        publishService();
      });
    }, 30000);

    // 4. Start periodic heartbeat status cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Stops the mDNS discovery scan and cleans up resources.
   */
  public static stopDiscovery(): void {
    console.log('[mDNS] Stopping discovery service...');
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.publishInterval) {
      clearInterval(this.publishInterval);
      this.publishInterval = null;
    }

    if (this.bonjour) {
      this.bonjour.destroy();
      this.bonjour = null;
    }

    console.log('[mDNS] Bonjour scanner destroyed.');
  }

  /**
   * Validates and extracts IPv4 address from bonjour service addresses list
   */
  private static getIPv4Address(addresses: string[]): string | null {
    if (!addresses || addresses.length === 0) return null;
    const ipv4Pattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    for (const addr of addresses) {
      if (ipv4Pattern.test(addr)) {
        return addr;
      }
    }
    return addresses[0]; // fallback
  }

  /**
   * Checks if the discovered service is a Siren device
   */
  private static isSirenDevice(service: any): boolean {
    const name = (service.name || '').toLowerCase();
    const host = (service.host || '').toLowerCase();
    const type = (service.type || '').toLowerCase();

    return (
      name.includes('siren') ||
      host.includes('siren') ||
      type.includes('siren')
    );
  }

  /**
   * Handle discovered device (UP event)
   */
  private static async handleDeviceUp(service: any): Promise<void> {
    try {
      if (!this.isSirenDevice(service)) {
        return;
      }

      const ipAddress = this.getIPv4Address(service.addresses);
      if (!ipAddress) {
        console.log(`[mDNS] Found siren device "${service.name}" but no valid IP address was resolved.`);
        return;
      }

      console.log(`[mDNS] Discovered SIREN device online:`);
      console.log(`      Name: ${service.name}`);
      console.log(`      IP:   ${ipAddress}`);
      console.log(`      Port: ${service.port}`);

      await SlaveDeviceService.upsertDevice({
        name: service.name,
        ipAddress,
        port: service.port || 80,
        status: 'online'
      });

    } catch (error) {
      console.error('[mDNS] Error handling device UP event:', error);
    }
  }

  /**
   * Handle device went offline (DOWN event)
   */
  private static async handleDeviceDown(service: any): Promise<void> {
    try {
      if (!this.isSirenDevice(service)) return;

      console.log(`[mDNS] SIREN device went offline: ${service.name}`);
      await SlaveDeviceService.markOffline(service.name);

    } catch (error) {
      console.error('[mDNS] Error handling device DOWN event:', error);
    }
  }

  /**
   * Start periodic database cleanup for inactive devices
   */
  private static startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        const cutoffTime = new Date(Date.now() - this.OFFLINE_TIMEOUT_MS);
        
        const expiredDevices = await SlaveDevice.find({
          status: 'online',
          lastSeen: { $lt: cutoffTime }
        });

        for (const device of expiredDevices) {
          console.log(`[mDNS Cleanup] Device "${device.name}" missed heartbeats. Marking offline.`);
          await SlaveDeviceService.markOffline(device.name);
        }
      } catch (error) {
        console.error('[mDNS Cleanup] Error running periodic status cleanup:', error);
      }
    }, this.CLEANUP_INTERVAL_MS);
  }
}
