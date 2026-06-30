import Bonjour from 'bonjour-service';

export class MdnsDiscoveryService {
  private static bonjour: Bonjour | null = null;
  private static publishInterval: NodeJS.Timeout | null = null;

  /**
   * Starts the mDNS service advertisement (publishing) and console logging browser.
   */
  public static startDiscovery(): void {
    if (this.bonjour) {
      console.log('[mDNS] Service is already running.');
      return;
    }

    this.bonjour = new Bonjour();
    console.log('[mDNS] Bonjour initialized.');

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
    console.log('MDNS Initialized');

    this.publishInterval = setInterval(() => {
      if (!this.bonjour) return;
      this.bonjour.unpublishAll(() => {
        console.log('Refreshing');
        publishService();
      });
    }, 30000);
  }

  /**
   * Stops the mDNS service advertisement.
   */
  public static stopDiscovery(): void {
    console.log('[mDNS] Stopping service...');

    if (this.publishInterval) {
      clearInterval(this.publishInterval);
      this.publishInterval = null;
    }

    if (this.bonjour) {
      this.bonjour.destroy();
      this.bonjour = null;
    }

    console.log('[mDNS] Bonjour publisher destroyed.');
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
   * Handle discovered device (UP event) - Logs to console only
   */
  private static handleDeviceUp(service: any): void {
    try {
      if (!this.isSirenDevice(service)) {
        return;
      }

      const ipAddress = this.getIPv4Address(service.addresses);
      if (!ipAddress) {
        console.log(`[mDNS] Found siren device "${service.name}" but no valid IP address was resolved.`);
        return;
      }

      console.log(`[mDNS] Located SIREN device online:`);
      console.log(`      Name: ${service.name}`);
      console.log(`      IP:   ${ipAddress}`);
      console.log(`      Port: ${service.port}`);
    } catch (error) {
      console.error('[mDNS] Error logging device UP event:', error);
    }
  }

  /**
   * Handle device went offline (DOWN event) - Logs to console only
   */
  private static handleDeviceDown(service: any): void {
    try {
      if (!this.isSirenDevice(service)) return;
      console.log(`[mDNS] SIREN device went offline: ${service.name}`);
    } catch (error) {
      console.error('[mDNS] Error logging device DOWN event:', error);
    }
  }
}
