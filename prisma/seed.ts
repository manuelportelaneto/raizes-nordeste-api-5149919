import { PrismaClient, Unidade } from "@prisma/client";
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando povoamento inicial do banco (Seed)...');

    // Limpeza prévia para garantir idempotência (ordem reversa das FKs)
    await prisma.logAuditoria.deleteMany();
    await prisma.pagamento.deleteMany();
    await prisma.itemPedido.deleteMany();
    await prisma.pedido.deleteMany();
    await prisma.produto.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.unidade.deleteMany();
    await prisma.estoqueUnidade.deleteMany();

    // 1. Criar Usuários com senhas hasheadas (Bcrypt) e conformidade LGPD
    const salt = await bcrypt.genSalt(10);
    const senhaHashAdmin = await bcrypt.hash('admin123', salt);
    const senhaHashAtendente = await bcrypt.hash('atendente123', salt);
    const senhaHashCliente = await bcrypt.hash('cliente123', salt);

    const usuarioAdmin = await prisma.usuario.create({
        data: {
            nome: "Administrador",
            email: "admin@raizes.com",
            senhaHash: senhaHashAdmin,
            perfil: "ADMIN",
            consentimentoLGPD: true,
            dataConsentimento: new Date(),
        },
    });

    const atendente = await prisma.usuario.create({
        data: {
            nome: "Atendente",
            email: "atendente@raizes.com",
            senhaHash: senhaHashAtendente,
            perfil: "ATENDENTE",
            consentimentoLGPD: true,
            dataConsentimento: new Date(),
        },
    });

    const cliente = await prisma.usuario.create({
        data: {
            nome: "Cliente",
            email: "[EMAIL_ADDRESS]",
            senhaHash: senhaHashCliente,
            perfil: "CLIENTE",
            consentimentoLGPD: true,
            dataConsentimento: new Date(),
        },
    });

    console.log('Usuários criados: Admin,Atendente e Cliente');

    // 2. Criar Unidades da Rede
    const matrizRecife = await prisma.unidade.create({
        data: {
            razaoSocial: 'Raizes do Nordeste Alimentos Ltda',
            nomeFantasia: 'Raizes do Nordeste - Matriz Recife',
            cnpj: '12.345.678/0001-90',
            endereco: 'Av. Boa Viagem, 1500 - Boa Viagem, Recife - PE',
            telefone: '(81) 3456-7890',
            email: 'recife@raizes.com'
        },
    });

    const filialOlinda = await prisma.unidade.create({
        data: {
            razaoSocial: 'Raizes do Nordeste Alimentos Ltda',
            nomeFantasia: 'Raizes do Nordeste - Filial Olinda',
            cnpj: '12.345.678/0002-71',
            endereco: 'Rua do Sol, 45 - Carmo, Olinda - PE',
            telefone: '(81) 3456-7891',
            email: 'olinda@raizes.com'
        },
    });

    console.log('Unidades criadas: matrizRecife, filialOlinda');

    // 3. Criar Produtos do Cardápio Regional
    const cuscuz = await prisma.produto.create({
        data: {
            nome: 'Cuscuz Nordestino com Carne de Sol',

            descricao: 'Cuscuz de milho flocado com carne de sol na nata e queijo coalho.',
            preco: 22.50,
            categoria: 'CUSCUZ',
            tags: 'cuscuz,carne,sol,queijo,coalho,',
        },
    });

    const boloDeRolo = await prisma.produto.create({
        data: {
            nome: 'Bolo de Rolo',
            descricao: 'Bolo de rolo tradicional pernambucano.',
            preco: 15.00,
            categoria: 'SOBREMESA',
            tags: 'bolo,rolo, sobremesa',
        },
    });

    const tapioca = await prisma.produto.create({
        data: {
            nome: 'Tapioca',
            descricao: 'Tapioca tradicional nordestina.',
            preco: 10.00,
            categoria: 'SOBREMESA',
            tags: 'tapioca, sobremesa',
        },
    });

    const cafe = await prisma.produto.create({
        data: {
            nome: 'Café',
            descricao: 'Café tradicional nordestino.',
            preco: 5.00,
            categoria: 'BEBIDA',
            tags: 'café, bebida',
        },
    });

    const macaxeira = await prisma.produto.create({
        data: {
            nome: 'Macaxeira',
            descricao: 'Macaxeira tradicional nordestina.',
            preco: 12.00,
            categoria: 'PRATO PRINCIPAL',
            tags: 'macaxeira, prato principal',
        },
    });

    console.log('Cardápio criado: Cuscuz, Bolo de Rolo, Tapioca, Café, Macaxeira');

    // 4. Cadastrar Estoque Inicial por Unidade (Controle de Indisponibilidade)
    await prisma.estoqueUnidade.createMany({
        data: [
            // Matriz Recife (estoque alto)
            { unidadeId: matrizRecife.id, produtoId: cuscuz.id, quantidade: 100, },
            { unidadeId: matrizRecife.id, produtoId: boloDeRolo.id, quantidade: 100, },
            { unidadeId: matrizRecife.id, produtoId: tapioca.id, quantidade: 100, },
            { unidadeId: matrizRecife.id, produtoId: cafe.id, quantidade: 100, },
            { unidadeId: matrizRecife.id, produtoId: macaxeira.id, quantidade: 100, },

            // Filial Olinda (estoque menor e cuscuz zerado para testar regra de 409)
            { unidadeId: filialOlinda.id, produtoId: cuscuz.id, quantidade: 0, indisponivel: true }, // zerado
            { unidadeId: filialOlinda.id, produtoId: boloDeRolo.id, quantidade: 5, }, // estoque baixo
            { unidadeId: filialOlinda.id, produtoId: tapioca.id, quantidade: 10, },
            { unidadeId: filialOlinda.id, produtoId: cafe.id, quantidade: 50, },
            { unidadeId: filialOlinda.id, produtoId: macaxeira.id, quantidade: 20, },
        ],
    });

    console.log('Estoque inicial criado: matrizRecife, filialOlinda (com cuscuz zerado em Olinda para teste de erro 409).');
    console.log('Seed concluído com sucesso!');
}

main()
    .catch((e) => {
        console.error('Erro no seed: ', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

