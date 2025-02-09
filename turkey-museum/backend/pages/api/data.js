import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // CORS Başlıklarını Ekleyin
  res.setHeader('Access-Control-Allow-Origin', '*'); // Tüm domainlere izin ver
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // İzin verilen HTTP metodları
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // İzin verilen header'lar

  // Eğer OPTIONS isteği geldiyse, 200 döndür
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const client = await clientPromise;
    const db = client.db('Ürünler');
    const collection = db.collection('ÜrünlerKoleksiyonu');

    // GET isteği - Tüm ürünleri getir
    if (req.method === 'GET') {
      const data = await collection.find({}).toArray();
      res.status(200).json(data);
      return;
    }

    // POST isteği - Stok güncelleme
    if (req.method === 'POST') {
      const { productId, change } = req.body;

      // Önce mevcut ürünü bul
      const currentProduct = await collection.findOne({ _id: new ObjectId(productId) });
      
      if (!currentProduct) {
        res.status(404).json({ message: 'Ürün bulunamadı' });
        return;
      }

      // Yeni stok miktarını hesapla
      const newStock = currentProduct.stokAdedi + parseInt(change);
      
      // Stok 0'ın altına düşemez
      if (newStock < 0) {
        res.status(400).json({ message: 'Yetersiz stok' });
        return;
      }

      // Stok güncelleme
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(productId) },
        { $set: { stokAdedi: newStock } },
        { returnDocument: 'after' }
      );

      res.status(200).json(result);
      return;
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Bir hata oluştu:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
}
