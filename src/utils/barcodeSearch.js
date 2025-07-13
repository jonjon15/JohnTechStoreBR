// Função para buscar produto no Bling API usando código de barras
export const searchProductByBarcode = async (barcode) => {
  try {
    // Configuração da API Bling
    const BLING_API_URL = 'https://www.bling.com.br/Api/v3';
    const ACCESS_TOKEN = process.env.REACT_APP_BLING_ACCESS_TOKEN;
    
    if (!ACCESS_TOKEN) {
      throw new Error('Token de acesso Bling não configurado');
    }

    console.log('🔍 Buscando produto com código:', barcode);

    // Primeiro, tentar buscar por GTIN (código de barras global)
    const gtinResponse = await fetch(`${BLING_API_URL}/produtos?criteria[gtin]=${barcode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (gtinResponse.ok) {
      const gtinData = await gtinResponse.json();
      if (gtinData.data && gtinData.data.length > 0) {
        console.log('✅ Produto encontrado por GTIN:', gtinData.data[0]);
        return {
          success: true,
          product: gtinData.data[0],
          searchType: 'gtin'
        };
      }
    }

    // Se não encontrou por GTIN, buscar por código geral
    const codeResponse = await fetch(`${BLING_API_URL}/produtos?criteria[codigo]=${barcode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (codeResponse.ok) {
      const codeData = await codeResponse.json();
      if (codeData.data && codeData.data.length > 0) {
        console.log('✅ Produto encontrado por código:', codeData.data[0]);
        return {
          success: true,
          product: codeData.data[0],
          searchType: 'codigo'
        };
      }
    }

    // Se não encontrou por código, buscar por nome/descrição
    const nameResponse = await fetch(`${BLING_API_URL}/produtos?criteria[nome]=${barcode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (nameResponse.ok) {
      const nameData = await nameResponse.json();
      if (nameData.data && nameData.data.length > 0) {
        console.log('✅ Produto encontrado por nome:', nameData.data[0]);
        return {
          success: true,
          product: nameData.data[0],
          searchType: 'nome'
        };
      }
    }

    // Produto não encontrado
    console.log('❌ Produto não encontrado:', barcode);
    return {
      success: false,
      message: 'Produto não encontrado no sistema',
      barcode: barcode
    };

  } catch (error) {
    console.error('❌ Erro na busca por código de barras:', error);
    return {
      success: false,
      message: error.message || 'Erro ao buscar produto',
      error: error
    };
  }
};

// Função para buscar produtos por texto livre (fallback)
export const searchProductsByText = async (searchText) => {
  try {
    const BLING_API_URL = 'https://www.bling.com.br/Api/v3';
    const ACCESS_TOKEN = process.env.REACT_APP_BLING_ACCESS_TOKEN;
    
    console.log('🔍 Busca por texto:', searchText);

    const response = await fetch(`${BLING_API_URL}/produtos?criteria[nome]=${encodeURIComponent(searchText)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        products: data.data || [],
        total: data.data?.length || 0
      };
    }

    throw new Error('Erro na busca por texto');

  } catch (error) {
    console.error('❌ Erro na busca por texto:', error);
    return {
      success: false,
      message: error.message,
      products: []
    };
  }
};

// Função para validar código de barras
export const validateBarcode = (barcode) => {
  if (!barcode || typeof barcode !== 'string') {
    return { valid: false, message: 'Código inválido' };
  }

  const cleanCode = barcode.trim();
  
  // Validar comprimento (códigos comuns: 8, 12, 13, 14 dígitos)
  if (cleanCode.length < 4 || cleanCode.length > 20) {
    return { valid: false, message: 'Código deve ter entre 4 e 20 caracteres' };
  }

  // Validar se contém apenas números (para códigos de barras tradicionais)
  const numericCode = cleanCode.replace(/\D/g, '');
  if (numericCode.length === cleanCode.length && numericCode.length >= 8) {
    return { 
      valid: true, 
      type: 'numeric',
      code: cleanCode,
      message: 'Código de barras numérico válido'
    };
  }

  // Aceitar códigos alfanuméricos também
  if (cleanCode.length >= 4) {
    return { 
      valid: true, 
      type: 'alphanumeric',
      code: cleanCode,
      message: 'Código alfanumérico válido'
    };
  }

  return { valid: false, message: 'Formato de código não reconhecido' };
};

// Função para busca inteligente (combina todas as estratégias)
export const smartBarcodeSearch = async (scannedCode) => {
  try {
    console.log('🤖 Busca inteligente iniciada para:', scannedCode);

    // 1. Validar código
    const validation = validateBarcode(scannedCode);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message
      };
    }

    // 2. Buscar produto no Bling
    const searchResult = await searchProductByBarcode(validation.code);
    
    if (searchResult.success) {
      return {
        success: true,
        product: searchResult.product,
        searchType: searchResult.searchType,
        message: `Produto encontrado via ${searchResult.searchType}!`
      };
    }

    // 3. Se não encontrou, sugerir busca manual
    return {
      success: false,
      message: 'Produto não encontrado. Tente buscar manualmente.',
      barcode: validation.code,
      suggestion: 'search_manual'
    };

  } catch (error) {
    console.error('❌ Erro na busca inteligente:', error);
    return {
      success: false,
      message: 'Erro interno na busca',
      error: error.message
    };
  }
};
