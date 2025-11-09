// src/view/Footer/Footer.js
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-200 mt-10 pt-12">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-5 gap-8 pb-12">
        
        {/* Column 1: Feedback */}
        <div>
          <h3 className="font-semibold mb-4">Đóng góp ý kiến</h3>
          <p>Chúng tôi luôn trân trọng và mong đợi nhận được mọi ý kiến đóng góp từ khách hàng để nâng cấp trải nghiệm dịch vụ và sản phẩm tốt hơn nữa.</p>
          <div className="flex space-x-3 mt-3">
            <a href="#" className="hover:text-blue-500">Facebook</a>
            <a href="#" className="hover:text-blue-400">Zalo</a>
            <a href="#" className="hover:text-red-500">TikTok</a>
            <a href="#" className="hover:text-pink-500">Instagram</a>
            <a href="#" className="hover:text-red-600">YouTube</a>
          </div>
        </div>

        {/* Column 2: CoolClub */}
        <div>
          <h3 className="font-semibold mb-4">CoolClub</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white">Tài khoản CoolClub</a></li>
            <li><a href="#" className="hover:text-white">Đăng kí thành viên</a></li>
            <li><a href="#" className="hover:text-white">Ưu đãi & Đặc quyền</a></li>
          </ul>
        </div>

        {/* Column 3: Chính sách */}
        <div>
          <h3 className="font-semibold mb-4">Chính sách</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white">Chính sách đổi trả 60 ngày</a></li>
            <li><a href="#" className="hover:text-white">Chính sách khuyến mãi</a></li>
            <li><a href="#" className="hover:text-white">Chính sách bảo mật</a></li>
            <li><a href="#" className="hover:text-white">Chính sách giao hàng</a></li>
          </ul>
        </div>

        {/* Column 4: Coolmate.me */}
        <div>
          <h3 className="font-semibold mb-4">Coolmate.me</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white">Lịch sử thay đổi website</a></li>
            <li><a href="#" className="hover:text-white">Chăm sóc khách hàng</a></li>
            <li><a href="#" className="hover:text-white">Trải nghiệm mua sắm 100% hài lòng</a></li>
            <li><a href="#" className="hover:text-white">Hỏi đáp - FAQs</a></li>
            <li><a href="#" className="hover:text-white">Blog</a></li>
          </ul>
        </div>

        {/* Column 5: Về COOLMATE */}
        <div>
          <h3 className="font-semibold mb-4">Về COOLMATE</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white">Quy tắc ứng xử của Coolmate</a></li>
            <li><a href="#" className="hover:text-white">Coolmate 101</a></li>
            <li><a href="#" className="hover:text-white">DVKH xuất sắc</a></li>
            <li><a href="#" className="hover:text-white">Câu chuyện về Coolmate</a></li>
            <li><a href="#" className="hover:text-white">Nhà máy</a></li>
            <li><a href="#" className="hover:text-white">Care & Share</a></li>
            <li><a href="#" className="hover:text-white">Cam kết bền vững</a></li>
          </ul>
        </div>
      </div>

      {/* Company info */}
      <div className="border-t border-gray-700 pt-6 pb-12 text-sm text-gray-400 text-center">
        <p>Địa chỉ liên hệ:</p>
        <p>Văn phòng Hà Nội: Tầng 3-4, Tòa nhà BMM, Km2, Đường Phùng Hưng, Phường Hà Đông, Thành phố Hà Nội</p>
        <p>Trung tâm vận hành Hà Nội: Lô C8, KCN Lại Yên, Xã Lại Yên, Huyện Hoài Đức, Thành phố Hà Nội</p>
        <p>Văn phòng và Trung tâm vận hành TP.HCM: Lô C3, đường D2, KCN Cát Lái, Thạnh Mỹ Lợi, TP. Thủ Đức, TP. Hồ Chí Minh</p>
        <p>Trung tâm R&D: T6-01, The Manhattan Vinhomes Grand Park, Long Bình, TP. Thủ Đức</p>
        <p>@ CÔNG TY TNHH FASTECH ASIA | Mã số doanh nghiệp: 0108617038 | Giấy chứng nhận đăng ký doanh nghiệp do Sở KH & ĐT TP Hà Nội cấp lần đầu ngày 20/02/2019</p>
      </div>
    </footer>
  );
}
