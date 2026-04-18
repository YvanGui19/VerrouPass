import express from 'express';
import { VaultItem } from '../models/VaultItem.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes du vault nécessitent une authentification
router.use(authenticateToken);

// GET /api/vault - Récupérer toutes les entrées du coffre
router.get('/', async (req, res) => {
  try {
    const items = await VaultItem.findAllByUser(req.user.userId);
    res.json({ items });
  } catch (err) {
    console.error('Erreur récupération vault:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des entrées' });
  }
});

// GET /api/vault/:id - Récupérer une entrée spécifique
router.get('/:id', async (req, res) => {
  try {
    const item = await VaultItem.findById(req.params.id, req.user.userId);

    if (!item) {
      return res.status(404).json({ error: 'Entrée non trouvée' });
    }

    res.json({ item });
  } catch (err) {
    console.error('Erreur récupération entrée:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'entrée' });
  }
});

// POST /api/vault - Créer une nouvelle entrée
router.post('/', async (req, res) => {
  try {
    const { encryptedData, iv } = req.body;

    // Validation
    if (!encryptedData || !iv) {
      return res.status(400).json({ error: 'Données chiffrées et IV requis' });
    }

    const item = await VaultItem.create(req.user.userId, encryptedData, iv);

    res.status(201).json({
      message: 'Entrée créée avec succès',
      item
    });
  } catch (err) {
    console.error('Erreur création entrée:', err);
    res.status(500).json({ error: 'Erreur lors de la création de l\'entrée' });
  }
});

// PUT /api/vault/:id - Modifier une entrée
router.put('/:id', async (req, res) => {
  try {
    const { encryptedData, iv } = req.body;

    // Validation
    if (!encryptedData || !iv) {
      return res.status(400).json({ error: 'Données chiffrées et IV requis' });
    }

    const item = await VaultItem.update(req.params.id, req.user.userId, encryptedData, iv);

    if (!item) {
      return res.status(404).json({ error: 'Entrée non trouvée' });
    }

    res.json({
      message: 'Entrée modifiée avec succès',
      item
    });
  } catch (err) {
    console.error('Erreur modification entrée:', err);
    res.status(500).json({ error: 'Erreur lors de la modification de l\'entrée' });
  }
});

// DELETE /api/vault/:id - Supprimer une entrée
router.delete('/:id', async (req, res) => {
  try {
    const item = await VaultItem.delete(req.params.id, req.user.userId);

    if (!item) {
      return res.status(404).json({ error: 'Entrée non trouvée' });
    }

    res.json({
      message: 'Entrée supprimée avec succès',
      id: item.id
    });
  } catch (err) {
    console.error('Erreur suppression entrée:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'entrée' });
  }
});

export default router;
