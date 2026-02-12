import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Simple password hash for seed (not for production auth)
function hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = createHash('sha256').update(password + salt).digest('hex');
    return `${salt}:${hash}`;
}

const SAMPLE_PRODUCTS = [
    {
        title: 'Rơm rạ khô - Đồng bằng sông Cửu Long',
        priceVnd: 15000,
        unit: 'kg',
        category: 'Rơm rạ',
        location: 'Cần Thơ',
        imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
        description: 'Rơm rạ khô chất lượng cao từ vụ mùa Đông-Xuân. Phù hợp làm thức ăn gia súc, phủ đất trồng nấm, hoặc làm nguyên liệu đốt sinh học. Đã phơi khô kỹ, không mốc.',
        co2SavingsKg: 12,
    },
    {
        title: 'Vỏ trấu nguyên chất',
        priceVnd: 8000,
        unit: 'kg',
        category: 'Vỏ trấu',
        location: 'An Giang',
        imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800',
        description: 'Vỏ trấu sạch từ nhà máy xay xát. Dùng làm nhiên liệu đốt, lót chuồng gia súc, hoặc trộn làm phân hữu cơ. Số lượng lớn, giao tận nơi.',
        co2SavingsKg: 8,
    },
    {
        title: 'Bã mía tươi - Nhà máy đường Biên Hòa',
        priceVnd: 5000,
        unit: 'kg',
        category: 'Bã mía',
        location: 'Đồng Nai',
        imageUrl: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800',
        description: 'Bã mía tươi từ dây chuyền ép mía. Thích hợp làm thức ăn gia súc, sản xuất giấy, hoặc làm phân compost. Giao hàng nhanh trong ngày.',
        co2SavingsKg: 15,
    },
    {
        title: 'Xơ dừa đã xử lý',
        priceVnd: 25000,
        unit: 'kg',
        category: 'Phụ phẩm dừa',
        location: 'Bến Tre',
        imageUrl: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800',
        description: 'Xơ dừa đã được rửa sạch, phơi khô, cắt nhỏ. Dùng làm giá thể trồng cây, lọc nước, hoặc sản xuất thảm. Chất lượng xuất khẩu.',
        co2SavingsKg: 20,
    },
    {
        title: 'Vỏ cà phê khô',
        priceVnd: 12000,
        unit: 'kg',
        category: 'Phụ phẩm cà phê',
        location: 'Đắk Lắk',
        imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800',
        description: 'Vỏ cà phê khô từ vụ thu hoạch. Giàu chất hữu cơ, phù hợp làm phân bón, lót chuồng, hoặc đốt sinh khối. Số lượng lớn từ 500kg.',
        co2SavingsKg: 10,
    },
    {
        title: 'Lá mía khô băm nhỏ',
        priceVnd: 6000,
        unit: 'kg',
        category: 'Bã mía',
        location: 'Tây Ninh',
        imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
        description: 'Lá mía đã phơi khô và băm nhỏ. Dùng làm thức ăn trâu bò, phủ đất giữ ẩm, hoặc ủ phân hữu cơ. Đóng bao 50kg tiện vận chuyển.',
        co2SavingsKg: 7,
    },
    {
        title: 'Mùn cưa gỗ keo',
        priceVnd: 4000,
        unit: 'kg',
        category: 'Mùn cưa',
        location: 'Bình Dương',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        description: 'Mùn cưa gỗ keo sạch từ xưởng chế biến gỗ. Dùng làm viên nén sinh khối, lót chuồng, hoặc trồng nấm. Không lẫn tạp chất.',
        co2SavingsKg: 18,
    },
    {
        title: 'Bã sắn công nghiệp',
        priceVnd: 3500,
        unit: 'kg',
        category: 'Bã sắn',
        location: 'Bình Phước',
        imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82ber43e?w=800',
        description: 'Bã sắn từ nhà máy tinh bột. Hàm lượng tinh bột còn lại cao, phù hợp làm thức ăn chăn nuôi hoặc ủ men sinh học.',
        co2SavingsKg: 14,
    },
    {
        title: 'Than trấu ép viên',
        priceVnd: 35000,
        unit: 'kg',
        category: 'Vỏ trấu',
        location: 'Long An',
        imageUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800',
        description: 'Than trấu đã ép viên, nhiệt lượng cao, ít khói. Thay thế than củi trong nấu ăn, sưởi ấm. Đóng gói 25kg.',
        co2SavingsKg: 25,
    },
    {
        title: 'Rơm cuộn tròn - Sẵn vận chuyển',
        priceVnd: 80000,
        unit: 'cuộn',
        category: 'Rơm rạ',
        location: 'Thái Bình',
        imageUrl: 'https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?w=800',
        description: 'Rơm đã cuộn tròn bằng máy, mỗi cuộn khoảng 15kg. Tiện lợi cho vận chuyển và bảo quản. Số lượng lớn có giảm giá.',
        co2SavingsKg: 15,
    },
    {
        title: 'Vỏ lạc (đậu phộng) khô',
        priceVnd: 7000,
        unit: 'kg',
        category: 'Phụ phẩm khác',
        location: 'Nghệ An',
        imageUrl: 'https://images.unsplash.com/photo-1567892320421-1c657571ea4a?w=800',
        description: 'Vỏ lạc đã phơi khô, sạch. Dùng làm nhiên liệu đốt, lót chuồng, hoặc ủ phân bón. Giàu cellulose và lignin.',
        co2SavingsKg: 6,
    },
    {
        title: 'Bã đậu nành tươi',
        priceVnd: 4500,
        unit: 'kg',
        category: 'Phụ phẩm khác',
        location: 'Hồ Chí Minh',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800',
        description: 'Bã đậu nành từ xưởng làm đậu hũ. Giàu protein, phù hợp làm thức ăn gia súc, gia cầm. Giao hàng sáng sớm hàng ngày.',
        co2SavingsKg: 5,
    },
];

async function main() {
    console.log('🌱 Bắt đầu seed database...');

    // Tạo user demo làm seller
    const passwordHash = hashPassword('DemoPass123!');

    const demoSeller = await prisma.user.upsert({
        where: { email: 'seller@eco-byproduct.vn' },
        update: {},
        create: {
            email: 'seller@eco-byproduct.vn',
            name: 'Nông Dân Xanh',
            passwordHash,
        },
    });

    console.log(`✅ Demo seller: ${demoSeller.email}`);

    // Xóa sản phẩm cũ của seller này (nếu có)
    await prisma.product.deleteMany({
        where: { sellerId: demoSeller.id },
    });

    // Tạo sản phẩm mẫu
    for (const product of SAMPLE_PRODUCTS) {
        await prisma.product.create({
            data: {
                ...product,
                sellerId: demoSeller.id,
            },
        });
        console.log(`  📦 ${product.title}`);
    }

    console.log(`\n✅ Đã thêm ${SAMPLE_PRODUCTS.length} sản phẩm mẫu!`);

    // --- SEED POLLUTION REPORTS ---
    console.log('🏭 Bắt đầu seed dữ liệu ô nhiễm...');

    // Clear old reports
    await prisma.pollutionReport.deleteMany({});

    // 1. Define base locations (City centers)
    const LOCATIONS = [
        { name: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
        { name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022 },
        { name: 'Hồ Chí Minh', lat: 10.8231, lng: 106.6297 },
        { name: 'Cần Thơ', lat: 10.0452, lng: 105.7469 },
        { name: 'Hải Phòng', lat: 20.8449, lng: 106.6881 },
    ];

    const POLLUTION_TYPES = ['WASTE', 'WATER', 'AIR', 'OTHER'];
    const DESCRIPTIONS = [
        'Rác thải sinh hoạt ùn ứ lâu ngày bốc mùi hôi thối.',
        'Cống nước thải đen ngòm, sủi bọt trắng xóa chảy ra sông.',
        'Khói bụi từ công trình xây dựng gây bụi mù mịt cả khu phố.',
        'Đốt rơm rạ gây khói mù mịt, khó thở cho người đi đường.',
        'Kênh rạch bị tắc nghẽn do rác thải nhựa.',
        'Mùi hóa chất nồng nặc từ khu công nghiệp gần đó.',
        'Bãi rác tự phát mọc lên ngay cạnh khu dân cư.',
        'Xả thải trộm ra môi trường vào ban đêm.',
        'Tiếng ồn quá lớn từ nhà máy hoạt động quá giờ quy định.',
        'Khói đen xả ra từ ống khói nhà máy.',
    ];

    const REPORTS_PER_LOCATION = 10;
    let reportCount = 0;

    for (const loc of LOCATIONS) {
        for (let i = 0; i < REPORTS_PER_LOCATION; i++) {
            // Random offset spread ~5-10km
            const latOffset = (Math.random() - 0.5) * 0.1;
            const lngOffset = (Math.random() - 0.5) * 0.1;

            const randomType = POLLUTION_TYPES[Math.floor(Math.random() * POLLUTION_TYPES.length)];
            const randomDesc = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
            const randomSeverity = Math.floor(Math.random() * 5) + 1; // 1-5

            await prisma.pollutionReport.create({
                data: {
                    ownerId: demoSeller.id,
                    lat: loc.lat + latOffset,
                    lng: loc.lng + lngOffset,
                    type: randomType,
                    severity: randomSeverity,
                    description: `${randomDesc} (Tại: ${loc.name})`,
                    isAnonymous: Math.random() > 0.5,
                }
            });
            reportCount++;
        }
    }

    console.log(`✅ Đã thêm ${reportCount} báo cáo ô nhiễm mẫu!`);
    console.log('🌿 Seed hoàn tất!');
}

main()
    .catch((e) => {
        console.error('❌ Seed thất bại:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
