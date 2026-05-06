export function calculateLifePath(dateStr: string): number | null {
  if (!dateStr) return null;
  const digits = dateStr.replace(/\D/g, '');
  if (digits.length < 8) return null;
  
  let sum = digits.split('').reduce((a, b) => a + parseInt(b, 10), 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((a, b) => a + parseInt(b, 10), 0);
  }
  return sum;
}

export function calculateDestiny(name: string): number | null {
  if (!name) return null;
  const map: Record<string, number> = {
    A:1, J:1, S:1, B:2, K:2, T:2, C:3, L:3, U:3,
    D:4, M:4, V:4, E:5, N:5, W:5, F:6, O:6, X:6,
    G:7, P:7, Y:7, H:8, Q:8, Z:8, I:9, R:9
  };
  const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanName) return null;
  
  let sum = cleanName.split('').reduce((acc, char) => acc + (map[char] || 0), 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((a, b) => a + parseInt(b, 10), 0);
  }
  return sum;
}

export const lifePathMeanings: Record<number, { title: string; description: string }> = {
  1: { title: "Sang Inovator (The Leader)", description: "Kamu dilahirkan untuk memimpin, mandiri, dan berani mengambil inisiatif. Jalanmu adalah tentang orisinalitas dan kepercayaan diri." },
  2: { title: "Sang Diplomat (The Peacemaker)", description: "Kamu memiliki kepekaan luar biasa terhadap orang lain. Jalanmu adalah harmoni, kerja sama, dan cinta." },
  3: { title: "Sang Komunikator (The Creative)", description: "Kamu penuh ekspresi, kreatif, dan menawan. Jalanmu adalah menyebarkan kegembiraan dan inspirasi melalui kata dan seni." },
  4: { title: "Sang Pembangun (The Builder)", description: "Kamu praktis, disiplin, dan pekerja keras. Jalanmu adalah menciptakan fondasi yang stabil dan sistem yang kuat." },
  5: { title: "Sang Petualang (The Free Spirit)", description: "Kamu mencintai kebebasan, perubahan, dan pengalaman baru. Jalanmu adalah eksplorasi dan kemampuan beradaptasi." },
  6: { title: "Sang Pengasuh (The Nurturer)", description: "Kamu penuh kasih, bertanggung jawab, dan protektif. Jalanmu adalah pelayanan, keluarga, dan penyembuhan." },
  7: { title: "Sang Pencari Fakta (The Seeker)", description: "Kamu analitis, spiritual, dan selalu mencari kebenaran. Jalanmu adalah kebijaksanaan, introspeksi, dan pemahaman mendalam." },
  8: { title: "Sang Eksekutif (The Powerhouse)", description: "Kamu ambisius, fokus pada tujuan, dan material. Jalanmu adalah kelimpahan, kekuasaan, dan pencapaian finansial." },
  9: { title: "Sang Kemanusiaan (The Humanitarian)", description: "Kamu welas asih, toleran, dan idealis. Jalanmu adalah membantu dunia, penyelesaian, dan cinta universal." },
  11: { title: "Sang Pencerah (The Illuminator)", description: "Angka Master. Kamu memiliki intuisi yang sangat tinggi, visioner, dan spiritual. Jalanmu adalah menginspirasi dan membimbing umat manusia." },
  22: { title: "Sang Pembangun Ahli (The Master Builder)", description: "Angka Master. Kamu dapat mengubah mimpi besar menjadi kenyataan praktis. Jalanmu adalah membangun sesuatu yang berdampak besar." },
  33: { title: "Sang Guru Master (The Master Teacher)", description: "Angka Master. Fokus pada cinta tanpa syarat dan penyembuhan spiritual. Jalanmu adalah melayani umat manusia dengan kasih sayang." },
};

export const destinyMeanings: Record<number, { title: string; description: string }> = {
  1: { title: "Kepemimpinan Sejati", description: "Takdirmu adalah untuk menjadi pelopor, mandiri, dan meninggalkan jejak sebagai seorang pemimpin inovatif." },
  2: { title: "Penjaga Harmoni", description: "Takdirmu adalah menjadi pembawa damai, bekerja sama, dan membangun kemitraan yang kuat." },
  3: { title: "Pancaran Ekspresi", description: "Takdirmu adalah untuk bersinar melalui kreativitas, komunikasi, dan membawa tawa bagi dunia." },
  4: { title: "Fondasi Kokoh", description: "Takdirmu adalah menjadi pilar stabilitas, bekerja dengan ketekunan, dan membangun karya yang bertahan lama." },
  5: { title: "Kebebasan & Perubahan", description: "Takdirmu adalah untuk mengeksplorasi dunia, beradaptasi, dan merangkul kebebasan dalam segala bentuknya." },
  6: { title: "Pelayanan & Cinta", description: "Takdirmu adalah untuk mengayomi, membimbing, dan menjadi pusat cinta bagi orang-orang di sekitarmu." },
  7: { title: "Kebijaksanaan Mendalam", description: "Takdirmu adalah mencari kebenaran, mempelajari misteri kehidupan, dan membagikan kebijaksanaan spiritual." },
  8: { title: "Kelimpahan & Otoritas", description: "Takdirmu adalah menguasai dunia materi, mencapai kesuksesan, dan menggunakan kekuasaan dengan bijak." },
  9: { title: "Cinta Universal", description: "Takdirmu adalah melayani kemanusiaan, melepaskan ego, dan menyelesaikan siklus dengan kasih sayang penuh." },
  11: { title: "Visi Spiritual", description: "Takdirmu adalah menjadi saluran pencerahan, menggunakan intuisimu untuk memandu dan menginspirasi." },
  22: { title: "Karya Monumental", description: "Takdirmu adalah menciptakan warisan besar, memadukan visi tinggi dengan tindakan nyata di dunia fisik." },
  33: { title: "Kasih Sayang Tanpa Syarat", description: "Takdirmu adalah menjadi penyembuh jiwa, guru spiritual yang memancarkan cinta universal." },
};
