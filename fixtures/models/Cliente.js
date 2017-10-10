function Cliente() {
	
}

Cliente.columnDefinition = function() {
	return {
		id: {
			label: 'Id',
			primaryKey: true
		},
		nome: {
			label: 'Nome'
		},
		nascimento: {
			label: 'Nascimento',
			type: 'date'
		},
		rg: {
			label: 'RG'
		},
		cpf: {
			label: 'CPF'
		},
		email: {
			label: 'e-mail'
		},
		enviaremailpromocional: {
			label: 'Enviar e-mail promocional?',
			type: 'boolean'
		},
		ultimaatualizacao: {
			label: 'Última Atualização',
			type: 'datetime'
		},
		valorconta: {
			label: 'Valor Conta',
			type: 'money'
		}
	}
}

Cliente.displayFields = ['nome']

module.exports = Cliente;