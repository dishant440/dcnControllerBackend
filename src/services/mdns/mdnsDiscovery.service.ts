import Bonjour from 'bonjour-service';

export class MdnsDiscoveryService {
  private static bonjour: Bonjour | null = null;
  private static publishInterval: NodeJS.Timeout | null = null;

  /**
   * Starts the mDNS service advertisement (publishing).
   */
  public static startDiscovery(): void {
    if (this.bonjour) {
      console.log('[mDNS] Service is already running.');
      return;
    }

    this.bonjour = new Bonjour();
    console.log('[mDNS] Bonjour publisher initialized.');

    // Publish local service (advertise this SBC server)
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
    console.log("MDNS Initialized");

    this.publishInterval = setInterval(() => {
      if (!this.bonjour) return;
      this.bonjour.unpublishAll(() => {
        console.log("Refreshing");
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
}
