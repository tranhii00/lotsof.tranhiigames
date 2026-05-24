// tunnel.js - Tạo public URL để chơi với người khác qua internet
const localtunnel = require('localtunnel');

const PORT = 3001;

(async () => {
    console.log('🔗 Đang tạo đường hầm công khai...\n');
    try {
        const tunnel = await localtunnel({ port: PORT, subdomain: 'caro-game-vn' });

        console.log('='.repeat(55));
        console.log('  ✅  ĐƯỜNG LINK CÔNG KHAI ĐÃ SẴN SÀNG!');
        console.log('='.repeat(55));
        console.log(`  🌐  ${tunnel.url}`);
        console.log('='.repeat(55));
        console.log('  📱  Chia sẻ link này cho đối thủ để chơi cùng!');
        console.log('  ⚠️   Lưu ý: Đường link chỉ hoạt động khi');
        console.log('       script này đang chạy.');
        console.log('='.repeat(55));

        tunnel.on('close', () => {
            console.log('\n❌ Đường hầm đã đóng.');
        });

        tunnel.on('error', (err) => {
            console.error('Lỗi tunnel:', err.message);
            console.log('Thử lại không có subdomain...');
            retryWithoutSubdomain();
        });

    } catch (err) {
        console.error('Không thể tạo tunnel với subdomain cố định:', err.message);
        retryWithoutSubdomain();
    }
})();

async function retryWithoutSubdomain() {
    try {
        const tunnel = await localtunnel({ port: PORT });
        console.log('='.repeat(55));
        console.log('  ✅  ĐƯỜNG LINK CÔNG KHAI (ngẫu nhiên)');
        console.log('='.repeat(55));
        console.log(`  🌐  ${tunnel.url}`);
        console.log('='.repeat(55));
    } catch (err) {
        console.error('❌ Không thể tạo tunnel:', err.message);
        console.log('\nGợi ý: Hãy dùng địa chỉ IP nội bộ nếu 2 máy cùng mạng WiFi.');
    }
}
