import { RouteHub, ShipmentStatus, TimelineEvent } from '../types';
import { getCurrentDateTimeFormatted, getStatusInfo } from './formatters';

export interface LocationResolution {
  name: string;
  address: string;
  coords: [number, number];
  district: string;
  isPostOffice?: boolean;
}

interface ProvinceGeo {
  name: string;
  aliases: string[];
  coords: [number, number];
  primarySocHub: { name: string; address: string; coords: [number, number] };
  localPostOffices: { district: string; name: string; address: string; coords: [number, number] }[];
}

export const VIETNAM_GEO_HUBS: ProvinceGeo[] = [
  {
    name: 'TP. Hồ Chí Minh',
    aliases: ['Hồ Chí Minh', 'TPHCM', 'TP.HCM', 'Sài Gòn', 'HCM', 'Thủ Đức'],
    coords: [10.8231, 106.6297],
    primarySocHub: {
      name: 'Kho Tổng Phân Loại Tân Phú SOC',
      address: 'Số 18 Đường Tân Thới Nhất 17, P. Tân Thới Nhất, Q. 12, TP.HCM',
      coords: [10.8354, 106.6189],
    },
    localPostOffices: [
      {
        district: 'TP. Thủ Đức',
        name: 'Bưu cục Thủ Đức - Thảo Điền',
        address: 'Số 42 Quốc Hương, P. Thảo Điền, TP. Thủ Đức',
        coords: [10.8052, 106.7380],
      },
      {
        district: 'Quận 1',
        name: 'Bưu cục Trung Tâm Q1 - Nguyễn Du',
        address: 'Số 02 Công Xã Paris / Nguyễn Du, P. Bến Nghé, Quận 1',
        coords: [10.7798, 106.6999],
      },
      {
        district: 'Quận 3',
        name: 'Bưu cục Quận 3 - Lê Văn Sỹ',
        address: 'Số 280 Lê Văn Sỹ, Phường 14, Quận 3',
        coords: [10.7878, 106.6791],
      },
      {
        district: 'Bình Thạnh',
        name: 'Bưu cục Bình Thạnh - Điện Biên Phủ',
        address: 'Số 125 Điện Biên Phủ, Phường 15, Quận Bình Thạnh',
        coords: [10.8013, 106.7115],
      },
      {
        district: 'Tân Bình',
        name: 'Bưu cục Tân Bình - Cộng Hòa',
        address: 'Số 18 Cộng Hòa, Phường 4, Quận Tân Bình',
        coords: [10.8014, 106.6542],
      },
      {
        district: 'Gò Vấp',
        name: 'Bưu cục Gò Vấp - Quang Trung',
        address: 'Số 350 Quang Trung, Phường 10, Quận Gò Vấp',
        coords: [10.8387, 106.6653],
      },
      {
        district: 'Quận 7',
        name: 'Bưu cục Quận 7 - Huỳnh Tấn Phát',
        address: 'Số 1420 Huỳnh Tấn Phát, Phú Mỹ, Quận 7',
        coords: [10.7340, 106.7320],
      },
    ],
  },
  {
    name: 'Hà Nội',
    aliases: ['Hà Nội', 'HN', 'Ha Noi'],
    coords: [21.0285, 105.8542],
    primarySocHub: {
      name: 'Kho Tổng Phân Loại Mê Linh SOC',
      address: 'Lô CN-08, KCN Quang Minh, Huyện Mê Linh, Hà Nội',
      coords: [21.1822, 105.7483],
    },
    localPostOffices: [
      {
        district: 'Cầu Giấy',
        name: 'Bưu cục Cầu Giấy 02 - Duy Tân',
        address: 'Số 15 Phố Duy Tân, Dịch Vọng Hậu, Quận Cầu Giấy',
        coords: [21.0327, 105.7831],
      },
      {
        district: 'Hoàn Kiếm',
        name: 'Bưu cục Bờ Hồ - Đinh Tiên Hoàng',
        address: 'Số 75 Đinh Tiên Hoàng, Tràng Tiền, Hoàn Kiếm',
        coords: [21.0288, 105.8525],
      },
      {
        district: 'Đống Đa',
        name: 'Bưu cục Đống Đa - Thái Hà',
        address: 'Số 120 Thái Hà, Trung Liệt, Đống Đa',
        coords: [21.0125, 105.8194],
      },
      {
        district: 'Hai Bà Trưng',
        name: 'Bưu cục Hai Bà Trưng - Phố Huế',
        address: 'Số 216 Phố Huế, Phố Huế, Hai Bà Trưng',
        coords: [21.0118, 105.8517],
      },
      {
        district: 'Thanh Xuân',
        name: 'Bưu cục Thanh Xuân - Nguyễn Trãi',
        address: 'Số 334 Nguyễn Trãi, Thanh Xuân Trung, Thanh Xuân',
        coords: [20.9937, 105.8072],
      },
      {
        district: 'Long Biên',
        name: 'Bưu cục Long Biên - Nguyễn Văn Cừ',
        address: 'Số 180 Nguyễn Văn Cừ, Bồ Đề, Long Biên',
        coords: [21.0487, 105.8791],
      },
      {
        district: 'Hà Đông',
        name: 'Bưu cục Hà Đông - Quang Trung',
        address: 'Số 4 Quang Trung, P. Quang Trung, Hà Đông',
        coords: [20.9715, 105.7744],
      },
    ],
  },
  {
    name: 'Đà Nẵng',
    aliases: ['Đà Nẵng', 'Da Nang', 'ĐN'],
    coords: [16.0544, 108.2022],
    primarySocHub: {
      name: 'Trung Tâm Khai Thác Hòa Cầm SOC',
      address: 'Đường số 3, KCN Hòa Cầm, Quận Cẩm Lệ, Đà Nẵng',
      coords: [16.0123, 108.1823],
    },
    localPostOffices: [
      {
        district: 'Hải Châu',
        name: 'Bưu cục Hải Châu - Lê Duẩn',
        address: 'Số 60 Lê Duẩn, Thạch Thang, Hải Châu, Đà Nẵng',
        coords: [16.0685, 108.2180],
      },
      {
        district: 'Thanh Khê',
        name: 'Bưu cục Thanh Khê - Điện Biên Phủ',
        address: 'Số 250 Điện Biên Phủ, Chính Gián, Thanh Khê',
        coords: [16.0645, 108.1892],
      },
      {
        district: 'Sơn Trà',
        name: 'Bưu cục Sơn Trà - Ngô Quyền',
        address: 'Số 120 Ngô Quyền, An Hải Bắc, Sơn Trà',
        coords: [16.0821, 108.2394],
      },
      {
        district: 'Ngũ Hành Sơn',
        name: 'Bưu cục Ngũ Hành Sơn - Lê Văn Hiến',
        address: 'Số 80 Lê Văn Hiến, Khuê Mỹ, Ngũ Hành Sơn',
        coords: [16.0134, 108.2541],
      },
    ],
  },
  {
    name: 'Bắc Ninh',
    aliases: ['Bắc Ninh', 'Bac Ninh'],
    coords: [21.1861, 106.0763],
    primarySocHub: {
      name: 'Kho Phân Phối Bắc Ninh SOC',
      address: 'Lô C4 KCN Quế Võ 1, Nam Sơn, TP. Bắc Ninh',
      coords: [21.1712, 106.1123],
    },
    localPostOffices: [
      {
        district: 'Quế Võ',
        name: 'Bưu cục KCN Quế Võ',
        address: 'Cổng KCN Quế Võ 1, QL18, Bắc Ninh',
        coords: [21.1712, 106.1123],
      },
      {
        district: 'TP. Bắc Ninh',
        name: 'Bưu cục Trung Tâm TP. Bắc Ninh',
        address: 'Số 01 Lý Thái Tổ, Suối Hoa, TP. Bắc Ninh',
        coords: [21.1861, 106.0763],
      },
      {
        district: 'Từ Sơn',
        name: 'Bưu cục Từ Sơn - Trần Phú',
        address: 'Số 150 Trần Phú, Đông Ngàn, Từ Sơn',
        coords: [21.1214, 105.9612],
      },
    ],
  },
  {
    name: 'Hải Phòng',
    aliases: ['Hải Phòng', 'Hai Phong'],
    coords: [20.8449, 106.6881],
    primarySocHub: {
      name: 'Kho Tổng Đình Vũ SOC - Hải Phòng',
      address: 'KCN Đình Vũ, Quận Hải An, Hải Phòng',
      coords: [20.8521, 106.7412],
    },
    localPostOffices: [
      {
        district: 'Ngô Quyền',
        name: 'Bưu cục Ngô Quyền - Lạch Tray',
        address: 'Số 50 Lạch Tray, Ngô Quyền, Hải Phòng',
        coords: [20.8492, 106.6923],
      },
      {
        district: 'Lê Chân',
        name: 'Bưu cục Lê Chân - Tô Hiệu',
        address: 'Số 120 Tô Hiệu, Lê Chân, Hải Phòng',
        coords: [20.8412, 106.6781],
      },
    ],
  },
  {
    name: 'Nghệ An',
    aliases: ['Nghệ An', 'Nghe An', 'Vinh'],
    coords: [18.6738, 105.6813],
    primarySocHub: {
      name: 'Kho Tổng Nghệ An SOC - Vinh',
      address: 'Đường tránh Vinh, Xã Hưng Đông, TP. Vinh, Nghệ An',
      coords: [18.6912, 105.6543],
    },
    localPostOffices: [
      {
        district: 'TP. Vinh',
        name: 'Bưu cục Trung Tâm TP. Vinh',
        address: 'Số 02 Nguyễn Thị Minh Khai, Lê Mao, TP. Vinh',
        coords: [18.6738, 105.6813],
      },
    ],
  },
  {
    name: 'Hưng Yên',
    aliases: ['Hưng Yên', 'Hung Yen', 'Văn Giang', 'Ecopark'],
    coords: [20.9635, 105.9325],
    primarySocHub: {
      name: 'Kho Phân Phối Bắc Ninh SOC (Liên vùng)',
      address: 'Lô C4 KCN Quế Võ 1, Nam Sơn, TP. Bắc Ninh',
      coords: [21.1712, 106.1123],
    },
    localPostOffices: [
      {
        district: 'Văn Giang',
        name: 'Bưu cục Văn Giang - Ecopark',
        address: 'Khu Phố Trúc, KĐT Ecopark, Xuân Quan, Văn Giang',
        coords: [20.9635, 105.9325],
      },
    ],
  },
  {
    name: 'Cần Thơ',
    aliases: ['Cần Thơ', 'Can Tho'],
    coords: [10.0452, 105.7469],
    primarySocHub: {
      name: 'Kho Tổng Tây Nam Bộ SOC - Cần Thơ',
      address: 'KCN Trà Nóc, Quận Bình Thủy, Cần Thơ',
      coords: [10.0823, 105.7192],
    },
    localPostOffices: [
      {
        district: 'Ninh Kiều',
        name: 'Bưu cục Ninh Kiều - 30 Tháng 4',
        address: 'Số 02 Hòa Bình / 30 Tháng 4, An Lạc, Ninh Kiều',
        coords: [10.0345, 105.7721],
      },
    ],
  },
  {
    name: 'Bình Dương',
    aliases: ['Bình Dương', 'Binh Duong'],
    coords: [11.1600, 106.6500],
    primarySocHub: {
      name: 'Kho Tổng Sóng Thần SOC - Bình Dương',
      address: 'KCN Sóng Thần 1, Dĩ An, Bình Dương',
      coords: [10.9023, 106.7421],
    },
    localPostOffices: [
      {
        district: 'Dĩ An',
        name: 'Bưu cục Dĩ An - Nguyễn An Ninh',
        address: 'Số 15 Nguyễn An Ninh, Dĩ An, Bình Dương',
        coords: [10.9082, 106.7712],
      },
      {
        district: 'Thủ Dầu Một',
        name: 'Bưu cục Thủ Dầu Một - Yersin',
        address: 'Số 50 Yersin, Phú Cường, Thủ Dầu Một',
        coords: [10.9804, 106.6519],
      },
    ],
  },
];

// Helper to find province
export function findProvinceGeo(cityOrAddress: string): ProvinceGeo {
  const normalized = (cityOrAddress || '').toLowerCase();
  for (const prov of VIETNAM_GEO_HUBS) {
    if (prov.aliases.some((alias) => normalized.includes(alias.toLowerCase()))) {
      return prov;
    }
  }
  // Default to TP.HCM if not found
  return VIETNAM_GEO_HUBS[0];
}

export function removeVietnameseTones(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/**
 * High-accuracy address resolver that pins real street coordinates
 * rather than arbitrary offsets that might land in water or parks.
 */
export function resolveAddressDetails(city: string, address: string): {
  addressCoords: [number, number];
  postOffice: { name: string; address: string; coords: [number, number] };
  province: ProvinceGeo;
} {
  const province = findProvinceGeo(`${city} ${address}`);
  const rawText = `${address} ${city}`.toLowerCase();
  const text = removeVietnameseTones(rawText);

  // 1. Precise Landmark & District Snapping
  let addressCoords: [number, number] = province.coords;
  let matchedPO = province.localPostOffices[0];

  if (province.name === 'TP. Hồ Chí Minh') {
    if (
      text.includes('masteri') ||
      text.includes('thao dien') ||
      text.includes('thu duc') ||
      text.includes('xa lo ha noi') ||
      text.includes('quoc huong')
    ) {
      addressCoords = [10.8038, 106.7418]; // Masteri Thảo Điền (159 Xa Lộ Hà Nội)
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'TP. Thủ Đức') ||
        province.localPostOffices[0];
    } else if (
      text.includes('bitexco') ||
      text.includes('hai trieu') ||
      text.includes('ben nghe') ||
      text.includes('quan 1') ||
      text.includes('q1') ||
      text.includes('q.1')
    ) {
      addressCoords = [10.7716, 106.7044]; // Tòa nhà Bitexco (Hải Triều / Hồ Tùng Mậu)
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Quận 1') ||
        province.localPostOffices[0];
    } else if (
      text.includes('le van sy') ||
      text.includes('quan 3') ||
      text.includes('q3') ||
      text.includes('q.3')
    ) {
      addressCoords = [10.7905, 106.6742]; // 450 Lê Văn Sỹ, P14, Q3
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Quận 3') ||
        province.localPostOffices[0];
    } else if (
      text.includes('binh thanh') ||
      text.includes('dien bien phu') ||
      text.includes('hang xanh')
    ) {
      addressCoords = [10.8013, 106.7115];
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Bình Thạnh') ||
        province.localPostOffices[0];
    } else if (
      text.includes('tan binh') ||
      text.includes('cong hoa') ||
      text.includes('san bay') ||
      text.includes('tan son nhat')
    ) {
      addressCoords = [10.8014, 106.6542];
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Tân Bình') ||
        province.localPostOffices[0];
    } else if (
      text.includes('quan 7') ||
      text.includes('q7') ||
      text.includes('phu my hung') ||
      text.includes('huynh tan phat')
    ) {
      addressCoords = [10.7340, 106.7320];
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Quận 7') ||
        province.localPostOffices[0];
    } else if (text.includes('go vap') || text.includes('quang trung')) {
      addressCoords = [10.8387, 106.6653];
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Gò Vấp') ||
        province.localPostOffices[0];
    }
  } else if (province.name === 'Hà Nội') {
    if (
      text.includes('cau giay') ||
      text.includes('dich vong') ||
      text.includes('duy tan')
    ) {
      addressCoords = [21.0345, 105.7920]; // Ngõ 165 Cầu Giấy
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Cầu Giấy') ||
        province.localPostOffices[0];
    } else if (
      text.includes('hoan kiem') ||
      text.includes('dinh tien hoang') ||
      text.includes('bo ho') ||
      text.includes('trang tien')
    ) {
      addressCoords = [21.0288, 105.8525];
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Hoàn Kiếm') ||
        province.localPostOffices[0];
    } else if (text.includes('dong da') || text.includes('thai ha')) {
      addressCoords = [21.0125, 105.8194];
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Đống Đa') ||
        province.localPostOffices[0];
    } else if (text.includes('hai ba trung') || text.includes('pho hue')) {
      addressCoords = [21.0118, 105.8517];
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Hai Bà Trưng') ||
        province.localPostOffices[0];
    } else if (text.includes('thanh xuan') || text.includes('nguyen trai')) {
      addressCoords = [20.9937, 105.8072];
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Thanh Xuân') ||
        province.localPostOffices[0];
    } else if (text.includes('long bien') || text.includes('nguyen van cu')) {
      addressCoords = [21.0487, 105.8791];
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Long Biên') ||
        province.localPostOffices[0];
    } else if (text.includes('ha dong') || text.includes('quang trung')) {
      addressCoords = [20.9715, 105.7744];
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Hà Đông') ||
        province.localPostOffices[0];
    }
  } else if (province.name === 'Đà Nẵng') {
    if (
      text.includes('le duan') ||
      text.includes('hai chau') ||
      text.includes('thach thang')
    ) {
      addressCoords = [16.0718, 108.2198]; // 112 Lê Duẩn
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Hải Châu') ||
        province.localPostOffices[0];
    } else if (text.includes('thanh khe') || text.includes('dien bien phu')) {
      addressCoords = [16.0645, 108.1892];
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Thanh Khê') ||
        province.localPostOffices[0];
    } else if (text.includes('son tra') || text.includes('ngo quyen')) {
      addressCoords = [16.0821, 108.2394];
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Sơn Trà') ||
        province.localPostOffices[0];
    } else if (text.includes('ngu hanh son') || text.includes('le van hien')) {
      addressCoords = [16.0134, 108.2541];
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Ngũ Hành Sơn') ||
        province.localPostOffices[0];
    }
  } else if (province.name === 'Bắc Ninh') {
    if (text.includes('que vo') || text.includes('nam son')) {
      addressCoords = [21.1712, 106.1123]; // KCN Quế Võ 1
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Quế Võ') ||
        province.localPostOffices[0];
    } else if (text.includes('tu son')) {
      addressCoords = [21.1214, 105.9612];
      matchedPO =
        province.localPostOffices.find((p) => p.district === 'Từ Sơn') ||
        province.localPostOffices[0];
    }
  } else if (province.name === 'Nghệ An') {
    if (
      text.includes('tran phu') ||
      text.includes('vinh') ||
      text.includes('hong son')
    ) {
      addressCoords = [18.6652, 105.6835]; // 154 Trần Phú, Vinh
      matchedPO = province.localPostOffices[0];
    }
  } else if (province.name === 'Hưng Yên') {
    if (
      text.includes('ecopark') ||
      text.includes('van giang') ||
      text.includes('xuan quan')
    ) {
      addressCoords = [20.9635, 105.9325]; // Ecopark Văn Giang
      matchedPO = province.localPostOffices[0];
    }
  }

  return {
    addressCoords,
    postOffice: matchedPO,
    province,
  };
}

export function getAirportGeo(provinceName: string): { name: string; address: string; coords: [number, number] } | null {
  const norm = (provinceName || '').toLowerCase();
  if (norm.includes('hồ chí minh') || norm.includes('hcm') || norm.includes('sài gòn')) {
    return {
      name: 'Ga Tải Hàng Không Sân Bay Tân Sơn Nhất (SGN)',
      address: 'Kho Air Cargo Tân Sơn Nhất, Đường Trường Sơn, Q. Tân Bình, TP.HCM',
      coords: [10.8188, 106.6519],
    };
  }
  if (norm.includes('hà nội') || norm.includes('hn')) {
    return {
      name: 'Ga Tải Hàng Không Sân Bay Nội Bài (HAN)',
      address: 'Kho Air Cargo ALS, Sân Bay Nội Bài, Sóc Sơn, Hà Nội',
      coords: [21.2212, 105.8072],
    };
  }
  if (norm.includes('đà nẵng') || norm.includes('đn')) {
    return {
      name: 'Ga Tải Hàng Không Sân Bay Đà Nẵng (DAD)',
      address: 'Kho Air Cargo Chuyên Dụng, Sân Bay Đà Nẵng, Hải Châu, Đà Nẵng',
      coords: [16.0439, 108.1994],
    };
  }
  if (norm.includes('cần thơ')) {
    return {
      name: 'Ga Tải Hàng Không Sân Bay Cần Thơ (VCA)',
      address: 'Đường Lê Hồng Phong, Q. Bình Thủy, Cần Thơ',
      coords: [10.0851, 105.7119],
    };
  }
  if (norm.includes('hải phòng')) {
    return {
      name: 'Ga Tải Hàng Không Sân Bay Cát Bi (HPH)',
      address: 'Đường Lê Hồng Phong, Hải An, Hải Phòng',
      coords: [20.8192, 106.7248],
    };
  }
  if (norm.includes('nghệ an') || norm.includes('vinh')) {
    return {
      name: 'Ga Tải Hàng Không Sân Bay Vinh (VII)',
      address: 'Nghi Liên, TP. Vinh, Nghệ An',
      coords: [18.7362, 105.6712],
    };
  }
  return null;
}

// Automatically builds complete hub chain from Origin to Destination with real street positions & airport flight hubs
export function autoBuildRouteHubs(
  senderCity: string,
  senderAddress: string,
  receiverCity: string,
  receiverAddress: string
): RouteHub[] {
  const originInfo = resolveAddressDetails(senderCity, senderAddress);
  const destInfo = resolveAddressDetails(receiverCity, receiverAddress);

  const hubs: RouteHub[] = [];

  // 1. Sender Location (exact street address)
  hubs.push({
    name: 'Điểm người gửi',
    location: senderAddress ? `${senderAddress}, ${originInfo.province.name}` : `${originInfo.province.name}`,
    coords: originInfo.addressCoords,
    type: 'sender',
  });

  // 2. Outbound local post office (actual post office facility)
  hubs.push({
    name: originInfo.postOffice.name,
    location: `${originInfo.postOffice.address}, ${originInfo.province.name}`,
    coords: originInfo.postOffice.coords,
    type: 'pickup_post',
  });

  const isInterProvincial = originInfo.province.name !== destInfo.province.name;
  const originAirport = getAirportGeo(originInfo.province.name);
  const destAirport = getAirportGeo(destInfo.province.name);

  if (isInterProvincial && originAirport && destAirport) {
    // Inter-provincial air flight route:
    // Outbound Airport SGN -> Inbound Airport HAN
    hubs.push({
      name: originAirport.name,
      location: originAirport.address,
      coords: originAirport.coords,
      type: 'airport_hub',
    });

    hubs.push({
      name: destAirport.name,
      location: destAirport.address,
      coords: destAirport.coords,
      type: 'airport_hub',
    });
  } else if (isInterProvincial) {
    // Land road inter-provincial
    hubs.push({
      name: originInfo.province.primarySocHub.name,
      location: originInfo.province.primarySocHub.address,
      coords: originInfo.province.primarySocHub.coords,
      type: 'soc_hub',
    });

    hubs.push({
      name: destInfo.province.primarySocHub.name,
      location: destInfo.province.primarySocHub.address,
      coords: destInfo.province.primarySocHub.coords,
      type: 'soc_hub',
    });
  } else {
    // Intra-city
    hubs.push({
      name: originInfo.province.primarySocHub.name,
      location: originInfo.province.primarySocHub.address,
      coords: originInfo.province.primarySocHub.coords,
      type: 'soc_hub',
    });
  }

  // Inbound Delivery Post Office (actual post office facility)
  hubs.push({
    name: destInfo.postOffice.name,
    location: `${destInfo.postOffice.address}, ${destInfo.province.name}`,
    coords: destInfo.postOffice.coords,
    type: 'delivery_post',
  });

  // Receiver Destination (exact street address)
  hubs.push({
    name: 'Địa chỉ người nhận',
    location: receiverAddress ? `${receiverAddress}, ${destInfo.province.name}` : `${destInfo.province.name}`,
    coords: destInfo.addressCoords,
    type: 'receiver',
  });

  return hubs;
}

// Automatically creates a timeline event when admin toggles status
export function generateAutoTimelineEvent(
  status: ShipmentStatus,
  senderCity: string,
  senderAddress: string,
  receiverCity: string,
  receiverAddress: string,
  shipperName?: string,
  shipperPhone?: string
): TimelineEvent {
  const hubs = autoBuildRouteHubs(senderCity, senderAddress, receiverCity, receiverAddress);
  const originProv = findProvinceGeo(senderCity);
  const destProv = findProvinceGeo(receiverCity);
  const statusInfo = getStatusInfo(status);
  const now = getCurrentDateTimeFormatted();

  let location = '';
  let title = statusInfo.label;
  let description = statusInfo.description;
  let eventCoords: [number, number] | undefined = undefined;

  switch (status) {
    case 'PENDING_PICKUP':
      location = hubs[0].location;
      title = 'Đã tạo phiếu gửi - Chờ bàn giao';
      description = `Người gửi đã in mã vận đơn và chuẩn bị hàng tại ${senderAddress || senderCity}. Bưu tá điều phối chuẩn bị qua lấy.`;
      eventCoords = hubs[0].coords;
      break;

    case 'PICKED_UP':
      location = hubs[1].location;
      title = `Đã lấy hàng & Nhập kho ${hubs[1].name}`;
      description = `Bưu tá đã tiếp nhận bưu phẩm nguyên vẹn, dán tem niêm phong và nhập vào hệ thống bưu cục ${hubs[1].name}.`;
      eventCoords = hubs[1].coords;
      break;

    case 'IN_TRANSIT':
      if (originProv.name === destProv.name) {
        location = hubs[2].location;
        title = `Đã nhập ${hubs[2].name}`;
        description = `Kiện hàng đang được phân luồng tự động để chuyển về bưu cục phát địa phương.`;
        eventCoords = hubs[2].coords;
      } else {
        location = `${originProv.primarySocHub.name} ➔ ${destProv.primarySocHub.name}`;
        title = `Đang trung chuyển liên tỉnh (${originProv.name} - ${destProv.name})`;
        description = `Kiện hàng đã rời ${originProv.primarySocHub.name} và đang vận chuyển chuyên tuyến tới ${destProv.primarySocHub.name}.`;
        eventCoords = destProv.primarySocHub.coords;
      }
      break;

    case 'OUT_FOR_DELIVERY':
      const deliveryHub = hubs[hubs.length - 2];
      location = deliveryHub.location;
      title = 'Bưu tá đang phát hàng tới người nhận';
      description = `Bưu tá ${shipperName || 'Khu vực'} đang trên đường giao hàng đến ${receiverAddress || receiverCity}. Quý khách vui lòng giữ liên lạc điện thoại.`;
      eventCoords = deliveryHub.coords;
      break;

    case 'DELIVERED':
      location = hubs[hubs.length - 1].location;
      title = 'Giao hàng thành công';
      description = `Người nhận đã ký nhận bưu phẩm nguyên đai nguyên kiện tại ${receiverAddress}. Hoàn tất hành trình giao vận.`;
      eventCoords = hubs[hubs.length - 1].coords;
      break;

    case 'FAILED_ATTEMPT':
      location = hubs[hubs.length - 2].location;
      title = 'Chưa liên hệ được người nhận (Hẹn giao lại)';
      description = `Bưu tá chưa thể kết nối qua điện thoại với người nhận tại ${receiverAddress}. Kiện hàng được lưu tạm tại bưu cục để phát lại lần tiếp theo.`;
      eventCoords = hubs[hubs.length - 2].coords;
      break;

    case 'RETURNED':
      location = hubs[1].location;
      title = 'Đang hoàn trả về người gửi';
      description = `Bưu phẩm được đóng gói niêm phong chuyển hoàn về địa chỉ ${senderAddress}.`;
      eventCoords = hubs[1].coords;
      break;

    case 'CANCELLED':
      location = hubs[0].location;
      title = 'Hủy vận đơn';
      description = 'Vận đơn đã hủy theo yêu cầu đối soát.';
      break;
  }

  return {
    id: `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: now,
    location,
    status,
    title,
    description,
    shipperName,
    shipperPhone,
    coords: eventCoords,
  };
}
