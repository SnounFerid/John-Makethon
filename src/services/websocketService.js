const socketIO = require('socket.io');

/**
 * WebSocket Service for real-time data broadcasting
 * Handles client connections, disconnections, and live data streaming
 */
class WebSocketService {
  constructor(server) {
    console.log('[WEBSOCKET] Initializing Socket.io service');
    this.io = socketIO(server, {
      cors: {
        origin: process.env.REACT_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.clients = new Map();
    this.broadcasters = new Map();
    this.setupHandlers();
    // Start mock broadcaster only when explicitly enabled. In production or when using
    // the simulator, prefer broadcasting from the sensor controller so clients only
    // receive simulated data.
    if (process.env.ENABLE_WS_MOCK === 'true') {
      this.startDataBroadcaster();
    } else {
      console.log('[WEBSOCKET] Mock broadcaster disabled (ENABLE_WS_MOCK!=true)');
    }
  }

  /**
   * Setup Socket.io event handlers
   */
  setupHandlers() {
    console.log('[WEBSOCKET] Setting up event handlers');

    this.io.on('connection', (socket) => {
      const clientId = socket.id;
      console.log('[WEBSOCKET] Client connected:', {
        clientId,
        timestamp: new Date().toISOString(),
        totalClients: this.io.engine.clientsCount,
      });

      // Store client metadata
      this.clients.set(clientId, {
        socketId: socket.id,
        connectedAt: new Date(),
        lastMessageAt: new Date(),
        latency: 0,
        isAlive: true,
      });

      // Client initialization
      socket.on('client:initialize', (data) => {
        console.log('[WEBSOCKET] Client initialization:', { clientId, data });
        const client = this.clients.get(clientId);
        if (client) {
          client.name = data?.clientName || 'Anonymous';
          client.type = data?.clientType || 'web';
        }
        socket.emit('server:initialized', {
          status: 'ready',
          clientId,
          timestamp: new Date().toISOString(),
        });
      });

      // Latency monitoring (ping/pong)
      socket.on('client:ping', (data) => {
        const client = this.clients.get(clientId);
        if (client) {
          const latency = Date.now() - data.timestamp;
          client.latency = latency;
          client.lastMessageAt = new Date();
          console.log('[WEBSOCKET] Ping received:', { clientId, latency: `${latency}ms` });
        }
        socket.emit('server:pong', {
          timestamp: Date.now(),
          latency: client?.latency || 0,
        });
      });

      // Subscribe to specific data streams
      socket.on('client:subscribe', (channels) => {
        console.log('[WEBSOCKET] Client subscribed to channels:', { clientId, channels });
        if (Array.isArray(channels)) {
          channels.forEach((channel) => {
            socket.join(`channel:${channel}`);
          });
        }
        socket.emit('server:subscribed', {
          channels,
          timestamp: new Date().toISOString(),
        });
      });

      // Unsubscribe from channels
      socket.on('client:unsubscribe', (channels) => {
        console.log('[WEBSOCKET] Client unsubscribed from channels:', { clientId, channels });
        if (Array.isArray(channels)) {
          channels.forEach((channel) => {
            socket.leave(`channel:${channel}`);
          });
        }
      });

      // Client disconnect
      socket.on('disconnect', () => {
        console.log('[WEBSOCKET] Client disconnected:', {
          clientId,
          connectedDuration: this.clients.get(clientId)
            ? Math.round((Date.now() - this.clients.get(clientId).connectedAt) / 1000) + 's'
            : 'unknown',
          totalClients: this.io.engine.clientsCount - 1,
        });
        this.clients.delete(clientId);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error('[WEBSOCKET] Socket error:', { clientId, error: error.message });
      });
    });
  }

  /**
   * Start broadcasting sensor data every 2 seconds
   */
  startDataBroadcaster() {
    console.log('[WEBSOCKET] Starting data broadcaster (2s interval)');

    const broadcastInterval = setInterval(() => {
      if (this.io.engine.clientsCount === 0) return;

      try {
        // Generate mock sensor data
        const sensorData = this.generateSensorData();

        // Broadcast to all connected clients
        this.io.emit('sensor:update', {
          data: sensorData,
          timestamp: new Date().toISOString(),
          clientCount: this.io.engine.clientsCount,
        });

        // Log broadcast info every 10 broadcasts (~20 seconds)
        if (Math.random() < 0.1) {
          console.log('[WEBSOCKET] Broadcasting sensor data to', this.io.engine.clientsCount, 'clients');
        }
      } catch (error) {
        console.error('[WEBSOCKET] Error broadcasting data:', error.message);
      }
    }, 2000);

    this.broadcasters.set('sensorData', broadcastInterval);
  }

  /**
   * Generate mock sensor data for broadcasting
   */
  generateSensorData() {
    return {
      pressure: parseFloat((Math.random() * 80 + 20).toFixed(2)),
      flow: parseFloat((Math.random() * 100 + 50).toFixed(2)),
      temperature: parseFloat((Math.random() * 40 + 15).toFixed(2)),
      conductivity: Math.round(Math.random() * 1000),
      location: 'Main Line',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Broadcast custom data to specific channel
   */
  broadcastToChannel(channel, eventName, data) {
    console.log('[WEBSOCKET] Broadcasting to channel:', { channel, eventName });
    this.io.to(`channel:${channel}`).emit(eventName, {
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast custom data to all clients
   */
  broadcastToAll(eventName, data) {
    console.log('[WEBSOCKET] Broadcasting to all clients:', eventName);
    this.io.emit(eventName, {
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit alert to all clients
   */
  broadcastAlert(alert) {
    console.log('[WEBSOCKET] Broadcasting alert:', { severity: alert.severity, message: alert.message });
    this.io.emit('alert:new', {
      alert,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const clients = Array.from(this.clients.values());
    const avgLatency = clients.length > 0
      ? Math.round(clients.reduce((sum, c) => sum + c.latency, 0) / clients.length)
      : 0;

    return {
      totalClients: this.io.engine.clientsCount,
      connectedClients: clients.length,
      avgLatency: `${avgLatency}ms`,
      clients: clients.map((c) => ({
        id: c.socketId.substring(0, 8),
        name: c.name || 'Anonymous',
        type: c.type || 'web',
        latency: `${c.latency}ms`,
        connectedSince: c.connectedAt.toISOString(),
      })),
    };
  }

  /**
   * Cleanup and shutdown
   */
  shutdown() {
    console.log('[WEBSOCKET] Shutting down WebSocket service');
    this.broadcasters.forEach((interval) => clearInterval(interval));
    this.io.close();
  }
}

module.exports = WebSocketService;
