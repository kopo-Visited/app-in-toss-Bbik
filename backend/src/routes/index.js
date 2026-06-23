import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productsRoutes from './products.routes.js';
import savedProductsRoutes from './savedProducts.routes.js';
import shareRoutes from './share.routes.js';

/**
 * /api 하위 라우터 집합. 기능별 라우터는 구현되는 단계에서 아래에 등록한다.
 */
const router = Router();

router.use('/auth', authRoutes); // F-001
router.use('/products', productsRoutes); // F-003
router.use('/saved-products', savedProductsRoutes); // F-004, F-005
router.use('/share', shareRoutes); // F-006
// router.use('/saved-products', savedProductsRoutes); // F-004, F-005 (4·5단계)
// router.use('/share', shareRoutes);                  // F-006 (6단계)

export default router;
